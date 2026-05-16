import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { adminNote } = await req.json();

  const upload = await prisma.prescriptionUpload.update({
    where: { id: params.id },
    data:  { status: "REJECTED", adminNote },
  });

  return NextResponse.json(upload);
}
