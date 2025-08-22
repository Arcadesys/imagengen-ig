import { prisma } from "./db"

export type GeneratorTheme = {
  // Tailwind class buckets that UIs can consume
  gradientBg?: string
  headerBg?: string
  accent?: string
  buttonPrimary?: string
  buttonSecondary?: string
}

export async function listGenerators(activeOnly = true) {
  // any-cast until prisma types refresh across envs
  return (prisma as any).imageGenerator.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { createdAt: "desc" },
  })
}

export async function getGeneratorBySlug(slug: string) {
  return (prisma as any).imageGenerator.findUnique({ where: { slug } })
}
