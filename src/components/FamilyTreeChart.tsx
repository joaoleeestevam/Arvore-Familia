"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import PhotoThumb from "@/components/PhotoThumb";
import { calculateAge } from "@/lib/dates";
import { sortByFullName } from "@/lib/sort";

export type TreePerson = {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE" | null;
  birthDate: string | null;
  deathDate: string | null;
  profilePhotoId: string | null;
  fatherId: string | null;
  motherId: string | null;
  generation: number;
};

export type TreeUnion = {
  partnerAId: string;
  partnerBId: string;
  active: boolean;
};

type Line = { x1: number; y1: number; x2: number; y2: number; key: string };

type Cluster =
  | { type: "single"; person: TreePerson; key: string }
  | { type: "couple"; a: TreePerson; b: TreePerson; active: boolean; key: string };

function clusterMembers(cluster: Cluster): TreePerson[] {
  return cluster.type === "single" ? [cluster.person] : [cluster.a, cluster.b];
}

function buildCouples(
  levelPeople: TreePerson[],
  spousesOf: Map<string, { id: string; active: boolean }[]>,
): Cluster[] {
  const idsInLevel = new Set(levelPeople.map((p) => p.id));
  const byId = new Map(levelPeople.map((p) => [p.id, p]));
  const consumed = new Set<string>();
  const clusters: Cluster[] = [];

  for (const person of levelPeople) {
    if (consumed.has(person.id)) continue;

    const spouseOption = (spousesOf.get(person.id) ?? []).find(
      (s) => idsInLevel.has(s.id) && !consumed.has(s.id),
    );

    if (spouseOption) {
      consumed.add(person.id);
      consumed.add(spouseOption.id);
      const spouse = byId.get(spouseOption.id)!;
      // homem à esquerda, mulher à direita, quando o sexo dos dois é conhecido
      const [a, b] =
        person.gender === "FEMALE" && spouse.gender === "MALE"
          ? [spouse, person]
          : [person, spouse];
      clusters.push({
        type: "couple",
        a,
        b,
        active: spouseOption.active,
        key: `${a.id}-${b.id}`,
      });
    } else {
      consumed.add(person.id);
      clusters.push({ type: "single", person, key: person.id });
    }
  }

  return clusters;
}

// Identifica de quais pais um cluster "pende", para juntar irmãos.
// Num casal, usa quem tiver pai/mãe conhecidos (o outro pode ter só "casado"
// na família, sem ascendência registrada).
function parentKeyFor(cluster: Cluster): string {
  const members = clusterMembers(cluster);
  const anchor = members.find((p) => p.fatherId || p.motherId) ?? members[0];
  return `${anchor.fatherId ?? ""}|${anchor.motherId ?? ""}`;
}

// Agrupa clusters da mesma geração por irmandade (mesmo pai/mãe) e ordena os
// grupos pela posição média dos pais na geração anterior, para os filhos
// ficarem visualmente abaixo de quem são realmente filhos.
function groupAndOrderClusters(
  clusters: Cluster[],
  parentOrder: Map<string, number>,
): Cluster[][] {
  const groups = new Map<string, Cluster[]>();
  const soloGroups: Cluster[][] = [];

  for (const cluster of clusters) {
    const key = parentKeyFor(cluster);
    if (key === "|") {
      // sem pai nem mãe conhecidos: não tem irmão para agrupar aqui
      soloGroups.push([cluster]);
      continue;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(cluster);
  }

  function anchorPosition(key: string): number {
    const [fatherId, motherId] = key.split("|");
    const positions = [fatherId, motherId]
      .filter(Boolean)
      .map((id) => parentOrder.get(id as string))
      .filter((p): p is number => p !== undefined);
    if (positions.length === 0) return Number.POSITIVE_INFINITY;
    return positions.reduce((a, b) => a + b, 0) / positions.length;
  }

  const orderedGroups = [...groups.entries()]
    .sort(([keyA], [keyB]) => anchorPosition(keyA) - anchorPosition(keyB))
    .map(([, cs]) => cs);

  return [...orderedGroups, ...soloGroups];
}

function layoutGenerations(people: TreePerson[], unions: TreeUnion[]) {
  const spousesOf = new Map<string, { id: string; active: boolean }[]>();
  for (const union of unions) {
    if (!spousesOf.has(union.partnerAId)) spousesOf.set(union.partnerAId, []);
    if (!spousesOf.has(union.partnerBId)) spousesOf.set(union.partnerBId, []);
    spousesOf
      .get(union.partnerAId)!
      .push({ id: union.partnerBId, active: union.active });
    spousesOf
      .get(union.partnerBId)!
      .push({ id: union.partnerAId, active: union.active });
  }

  const levels = new Map<number, TreePerson[]>();
  for (const person of people) {
    const list = levels.get(person.generation) ?? [];
    list.push(person);
    levels.set(person.generation, list);
  }
  const sortedGenerations = [...levels.keys()].sort((a, b) => a - b);

  const parentOrder = new Map<string, number>();
  const result: { generation: number; groups: Cluster[][] }[] = [];

  for (const generation of sortedGenerations) {
    const levelPeople = sortByFullName(levels.get(generation)!);
    const clusters = buildCouples(levelPeople, spousesOf);
    const groups = groupAndOrderClusters(clusters, parentOrder);

    let index = 0;
    for (const group of groups) {
      for (const cluster of group) {
        for (const member of clusterMembers(cluster)) {
          parentOrder.set(member.id, index);
        }
        index++;
      }
    }

    result.push({ generation, groups });
  }

  return result;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2;

export default function FamilyTreeChart({
  people,
  unions = [],
}: {
  people: TreePerson[];
  unions?: TreeUnion[];
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const dragState = useRef<{
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const [lines, setLines] = useState<Line[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const generations = layoutGenerations(people, unions);

  const computeLines = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const viewportRect = viewport.getBoundingClientRect();
    const nextLines: Line[] = [];

    for (const person of people) {
      const childEl = nodeRefs.current.get(person.id);
      if (!childEl) continue;
      const childRect = childEl.getBoundingClientRect();
      const childX = childRect.left + childRect.width / 2 - viewportRect.left;
      const childY = childRect.top - viewportRect.top;

      for (const parentId of [person.fatherId, person.motherId]) {
        if (!parentId) continue;
        const parentEl = nodeRefs.current.get(parentId);
        if (!parentEl) continue;
        const parentRect = parentEl.getBoundingClientRect();
        const parentX =
          parentRect.left + parentRect.width / 2 - viewportRect.left;
        const parentY = parentRect.bottom - viewportRect.top;

        nextLines.push({
          key: `${parentId}-${person.id}`,
          x1: parentX,
          y1: parentY,
          x2: childX,
          y2: childY,
        });
      }
    }
    setLines(nextLines);
  }, [people]);

  // recalcula as linhas quando a árvore muda de tamanho ou a tela é redimensionada
  useEffect(() => {
    computeLines();
    const observer = new ResizeObserver(computeLines);
    if (viewportRef.current) observer.observe(viewportRef.current);
    window.addEventListener("resize", computeLines);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", computeLines);
    };
  }, [computeLines, unions.length]);

  // recalcula as linhas quando o usuário arrasta ou dá zoom
  useEffect(() => {
    computeLines();
  }, [computeLines, pan, zoom]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function startDrag(clientX: number, clientY: number) {
    dragState.current = { startX: clientX, startY: clientY, panX: pan.x, panY: pan.y };
    setIsDragging(true);
  }

  function moveDrag(clientX: number, clientY: number) {
    if (!dragState.current) return;
    const dx = clientX - dragState.current.startX;
    const dy = clientY - dragState.current.startY;
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
  }

  function endDrag() {
    dragState.current = null;
    setIsDragging(false);
  }

  useEffect(() => {
    if (!isDragging) return;
    function onMouseMove(e: MouseEvent) {
      moveDrag(e.clientX, e.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (touch) moveDrag(touch.clientX, touch.clientY);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", endDrag);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", endDrag);
    };
  }, [isDragging]);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await wrapperRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen();
    }
  }

  function zoomBy(delta: number) {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  }

  function resetView() {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }

  return (
    <div
      ref={wrapperRef}
      className={
        isFullscreen
          ? "bg-stone-50 p-4 dark:bg-stone-950"
          : "relative"
      }
    >
      <div className="mb-2 flex justify-end gap-1.5">
        <button
          type="button"
          onClick={() => zoomBy(-0.15)}
          title="Diminuir zoom"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.15)}
          title="Aumentar zoom"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          title="Restaurar posição"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Sair da tela cheia" : "Expandir para tela cheia"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <div
        ref={viewportRef}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (touch) startDrag(touch.clientX, touch.clientY);
        }}
        className={
          "relative select-none overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/40 " +
          (isDragging ? "cursor-grabbing" : "cursor-grab") +
          (isFullscreen ? " h-[calc(100vh-4.5rem)]" : " h-[65vh]")
        }
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {lines.map((line) => (
            <line
              key={line.key}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className="stroke-stone-300 dark:stroke-stone-700"
              strokeWidth={2}
            />
          ))}
        </svg>

        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          className="flex min-w-max flex-col gap-10 p-8"
        >
          {generations.map(({ generation, groups }) => (
            <div key={generation} className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                Geração {generation + 1}
              </span>
              <div className="flex flex-wrap justify-center gap-x-9 gap-y-6">
                {groups.map((group) => (
                  <div
                    key={group.map((c) => c.key).join("_")}
                    className="flex flex-wrap justify-center gap-3"
                  >
                    {group.map((cluster) =>
                      cluster.type === "single" ? (
                        <TreeNode
                          key={cluster.person.id}
                          person={cluster.person}
                          registerRef={(el) => {
                            if (el) nodeRefs.current.set(cluster.person.id, el);
                            else nodeRefs.current.delete(cluster.person.id);
                          }}
                        />
                      ) : (
                        <div key={cluster.key} className="flex items-center">
                          <TreeNode
                            person={cluster.a}
                            registerRef={(el) => {
                              if (el) nodeRefs.current.set(cluster.a.id, el);
                              else nodeRefs.current.delete(cluster.a.id);
                            }}
                          />
                          <div
                            className={
                              "mx-0.5 h-px w-4 shrink-0 " +
                              (cluster.active
                                ? "bg-stone-300 dark:bg-stone-600"
                                : "border-t border-dashed border-stone-300 bg-transparent dark:border-stone-600")
                            }
                          />
                          <TreeNode
                            person={cluster.b}
                            registerRef={(el) => {
                              if (el) nodeRefs.current.set(cluster.b.id, el);
                              else nodeRefs.current.delete(cluster.b.id);
                            }}
                          />
                        </div>
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-stone-400 dark:text-stone-500">
        Arraste com o mouse (ou o dedo) para mover. Use os botões acima para
        zoom e tela cheia.
      </p>
    </div>
  );
}

function TreeNode({
  person,
  registerRef,
}: {
  person: TreePerson;
  registerRef: (el: HTMLElement | null) => void;
}) {
  const age = calculateAge(person.birthDate, person.deathDate ?? undefined);
  const statusLabel = person.deathDate
    ? age !== null
      ? `† aos ${age} anos`
      : "†"
    : age !== null
      ? `${age} anos`
      : null;

  const ringClass =
    person.gender === "MALE"
      ? "ring-2 ring-sky-300 dark:ring-sky-700"
      : person.gender === "FEMALE"
        ? "ring-2 ring-pink-300 dark:ring-pink-700"
        : "ring-2 ring-stone-200 dark:ring-stone-700";

  return (
    <Link
      ref={registerRef}
      href={`/arvore/${person.id}`}
      draggable={false}
      className="flex w-28 flex-col items-center gap-1.5 rounded-xl border border-stone-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
    >
      <div
        className={`h-14 w-14 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800 ${ringClass}`}
      >
        {person.profilePhotoId ? (
          <PhotoThumb photoId={person.profilePhotoId} alt={person.fullName} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg text-stone-400">
            {person.fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="line-clamp-2 text-xs font-medium leading-tight text-stone-900 dark:text-stone-100">
        {person.fullName}
      </div>
      {statusLabel && (
        <div className="text-[11px] text-stone-500 dark:text-stone-400">
          {statusLabel}
        </div>
      )}
    </Link>
  );
}
