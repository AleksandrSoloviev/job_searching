import type { Company } from '@/lib/schema'

export const companyFameRank = (company: Company): number => {
  const rank = company.fameRank

  if (typeof rank === 'number' && Number.isFinite(rank)) {
    return rank
  }

  return Number.POSITIVE_INFINITY
}

export const compareCompaniesByFame = (left: Company, right: Company): number => {
  const rankDiff = companyFameRank(left) - companyFameRank(right)

  if (rankDiff !== 0) {
    return rankDiff
  }

  return left.name.localeCompare(right.name, 'ru', { sensitivity: 'base' })
}

export const sortCompaniesByFame = (companies: Company[]): Company[] => {
  return [...companies].sort(compareCompaniesByFame)
}
