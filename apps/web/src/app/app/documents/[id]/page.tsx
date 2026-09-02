import { Suspense } from "react";
import { DocumentWorkspace } from "@/components/document-workspace";
import { Skeleton } from "@/components/ui";
export const metadata = { title: "文档学习空间" };
export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton />}>
      <DocumentWorkspace id={id} />
    </Suspense>
  );
}
