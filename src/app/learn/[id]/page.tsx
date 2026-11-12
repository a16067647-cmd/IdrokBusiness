import { notFound } from "next/navigation";
import { LEVEL0, getLesson } from "@/lib/lessons/level0";
import { LessonPlayer } from "@/components/learn/LessonPlayer";

export function generateStaticParams() {
  return LEVEL0.map((l) => ({ id: l.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getLesson(id)) notFound();
  return <LessonPlayer id={id} />;
}
