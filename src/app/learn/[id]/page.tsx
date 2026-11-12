import { COURSE } from "@/lib/lessons/level0";
import { LessonPlayer } from "@/components/learn/LessonPlayer";

// Bundled lessons are pre-rendered; lessons added by an admin render on demand.
export const dynamicParams = true;

export function generateStaticParams() {
  return COURSE.map((l) => ({ id: l.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonPlayer id={id} />;
}
