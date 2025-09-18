import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import AccountClient from "./profile-client"

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, phone: true } })

  return <AccountClient initial={{ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" }} />
}

