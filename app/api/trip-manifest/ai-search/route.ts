import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/* ==========================================================================
   TYPES
   ========================================================================== */

interface AISearchRequestBody {
  query: string

  truckers?: string[]
  drivers?: string[]
  truckTypes?: string[]

  // Optional additional candidate lists.
  // These are safe to add from your frontend when available.
  plates?: string[]
  containers?: string[]
  seals?: string[]
  shipTos?: string[]
  materials?: string[]
  descriptions?: string[]
  manifests?: string[]
  dns?: string[]
  pos?: string[]
  bols?: string[]
  invoices?: string[]
}

interface AIFilter {
  type: string
  value?: string
  label?: string
  range?: string
  days?: number
  status?: string
  negate?: boolean
  min?: number
  max?: number
}

interface AIResult {
  filters: AIFilter[]
  sortDir: 'asc' | 'desc' | null
  confidence: number
  matched?: string[]
  warnings?: string[]
}

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const MAX_QUERY_LENGTH = 500

const FILTER_TYPES = new Set([
  'month',
  'dateRange',
  'dispatchStatus',
  'noDocuments',
  'trucker',
  'driver',
  'truckType',
  'plate',
  'qty',
  'cbm',
  'freeText',
  'manifestStatus',
  'container',
  'seal',
  'shipTo',
  'timeRange',
])

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTH_ALIASES: Record<string, string> = {
  jan: 'January',
  january: 'January',

  feb: 'February',
  february: 'February',

  mar: 'March',
  march: 'March',

  apr: 'April',
  april: 'April',

  may: 'May',

  jun: 'June',
  june: 'June',

  jul: 'July',
  july: 'July',

  aug: 'August',
  august: 'August',

  sep: 'September',
  sept: 'September',
  september: 'September',

  oct: 'October',
  october: 'October',

  nov: 'November',
  november: 'November',

  dec: 'December',
  december: 'December',
}

/* ==========================================================================
   DISPATCH STATUS VOCABULARY
   ========================================================================== */

const STATUS_COMPLETE = [
  'complete',
  'completed',
  'fully dispatched',
  'fully dispatch',
  'full dispatch',
  'full dispatched',
  'finished',
  'done',
  'closed',
  'fulfilled',
  'full load',
  'fully loaded',
  'all dispatched',
  'full qty',
  'full quantity',
  'full quantities',
  '100%',
  '100 percent',
  '100 percent dispatched',
  'fully delivered',
  'fully loaded',
]

const STATUS_SHORT = [
  'short',
  'short dispatch',
  'short dispatched',
  'short shipment',
  'short shipped',
  'partial',
  'partially dispatched',
  'partial dispatch',
  'under dispatch',
  'under dispatched',
  'under-dispatched',
  'incomplete load',
  'not full',
  'half loaded',
  'partially loaded',
  'shortage',
  'under loaded',
  'underloaded',
  'short loaded',
  'short load',
  'quantity short',
  'qty short',
  'short qty',
  'dispatch shortage',
]

const STATUS_NOT_COMPLETE = [
  'not complete',
  'not completed',
  'incomplete',
  'not fully dispatched',
  'not fully dispatch',
  'not finished',
  'unfinished',
  'open',
  'pending',
  'in progress',
  'not done',
  'still open',
  'not yet complete',
  'not yet completed',
  'awaiting dispatch',
  'awaiting completion',
  'incomplete dispatch',
]

/* ==========================================================================
   MANIFEST STATUS
   ========================================================================== */

const MANIFEST_STATUS_DRAFT = [
  'draft',
  'drafts',
  'is draft',
  'in draft',
  'draft manifest',
  'draft manifests',
  'saved as draft',
  'not submitted',
  'unsubmitted',
  'unsent',
]

const MANIFEST_STATUS_COMPLETED = [
  'manifest completed',
  'completed manifest',
  'completed manifests',
  'status completed',
  'is completed',
  'completed status',
  'finalized',
  'finalised',
  'finalized manifest',
  'finalised manifest',
  'submitted',
  'submitted manifest',
  'closed manifest',
]

/* ==========================================================================
   DOCUMENTS
   ========================================================================== */

const NO_DOCUMENTS = [
  'no documents',
  'without documents',
  'missing documents',
  'documents missing',
  'no document',
  'without document',
  'missing document',

  'no docs',
  'without docs',
  'missing docs',
  'docs missing',

  'undocumented',
  'no paperwork',
  'without paperwork',
  'missing paperwork',

  'no files',
  'without files',
  'missing files',

  'no attachments',
  'without attachments',
  'missing attachments',

  'no dn',
  'without dn',
  'missing dn',
]

const HAS_DOCUMENTS = [
  'with documents',
  'has documents',
  'have documents',
  'with docs',
  'has docs',
  'have docs',
  'documented',
  'with paperwork',
  'has paperwork',
  'with files',
  'has files',
  'with attachments',
  'has attachments',
]

/* ==========================================================================
   ENTITY KEYWORDS
   ========================================================================== */

const DRIVER_KEYWORDS = [
  'driver',
  'driver name',
  'driven by',
  'driving by',
  'operated by',
  'operator',
  'chauffeur',
]

const TRUCKER_KEYWORDS = [
  'trucker',
  'trucking company',
  'transport company',
  'transportation company',
  'logistics company',
  'carrier',
  'hauler',
  'transporter',
  'fleet',
]

const TRUCK_TYPE_KEYWORDS = [
  'truck type',
  'trucktype',
  'vehicle type',
  'type of truck',
  'trailer type',
  'equipment type',
  'unit type',
  'body type',
]

/* ==========================================================================
   SORT
   ========================================================================== */

const SORT_DESC = [
  'newest first',
  'latest first',
  'newest',
  'latest',
  'descending',
  'desc',
  'recent first',
  'most recent',
  'reverse chronological',
  'newest to oldest',
  'last first',
  'latest to oldest',
  'recent',
  'most recent first',
]

const SORT_ASC = [
  'oldest first',
  'earliest first',
  'oldest',
  'earliest',
  'ascending',
  'asc',
  'chronological',
  'oldest to newest',
  'earliest to latest',
  'first first',
  'oldest first',
]

/* ==========================================================================
   QUERY OPERATORS
   ========================================================================== */

const ENTITY_STOP_WORDS = [
  'with',
  'without',
  'for',
  'from',
  'in',
  'on',
  'at',
  'and',
  'or',
  'except',
  'excluding',
  'exclude',
  'not',
  'sorted',
  'sort',
  'by',
  'last',
  'past',
  'previous',
  'next',
  'over',
  'under',
  'above',
  'below',
  'between',
  'during',
  'within',
  'where',
  'that',
  'which',
]

/* ==========================================================================
   NORMALIZATION
   ========================================================================== */

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[%]+/g, ' percent ')
    .replace(/[_]+/g, ' ')
    .replace(/[^\p{L}\p{N}./+#-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(value: string): string[] {
  return normalize(value)
    .split(/\s+/)
    .filter(Boolean)
}

/* ==========================================================================
   WORD / PHRASE HELPERS
   ========================================================================== */

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasWord(
  text: string,
  word: string
): boolean {
  const normalizedText = normalize(text)
  const normalizedWord = normalize(word)

  if (!normalizedWord) return false

  return new RegExp(
    `(?:^|\\s)${escapeRegex(normalizedWord)}(?:\\s|$)`,
    'i'
  ).test(normalizedText)
}

function hasPhrase(
  text: string,
  phrases: string[]
): boolean {
  const normalizedText = normalize(text)

  return phrases.some(
    phrase => {
      const normalizedPhrase = normalize(phrase)

      if (!normalizedPhrase) return false

      return normalizedText.includes(
        normalizedPhrase
      )
    }
  )
}

function addFilter(
  filters: AIFilter[],
  filter: AIFilter
): void {
  if (!FILTER_TYPES.has(filter.type)) {
    return
  }

  const duplicate = filters.some(
    existing =>
      existing.type === filter.type &&
      existing.value === filter.value &&
      existing.status === filter.status &&
      existing.min === filter.min &&
      existing.max === filter.max &&
      existing.negate === filter.negate &&
      existing.range === filter.range
  )

  if (!duplicate) {
    filters.push(filter)
  }
}

/* ==========================================================================
   LEVENSHTEIN
   ========================================================================== */

function levenshtein(
  a: string,
  b: string
): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const previous = Array.from(
    { length: b.length + 1 },
    (_, i) => i
  )

  for (
    let i = 1;
    i <= a.length;
    i++
  ) {
    const current = [i]

    for (
      let j = 1;
      j <= b.length;
      j++
    ) {
      const insertion =
        current[j - 1] + 1

      const deletion =
        previous[j] + 1

      const replacement =
        previous[j - 1] +
        (a[i - 1] === b[j - 1] ? 0 : 1)

      current.push(
        Math.min(
          insertion,
          deletion,
          replacement
        )
      )
    }

    for (
      let j = 0;
      j < current.length;
      j++
    ) {
      previous[j] = current[j]
    }
  }

  return previous[b.length]
}

/* ==========================================================================
   SIMILARITY
   ========================================================================== */

function similarity(
  a: string,
  b: string
): number {
  const x = normalize(a)
  const y = normalize(b)

  if (!x || !y) return 0

  if (x === y) {
    return 1
  }

  if (
    x.includes(y) ||
    y.includes(x)
  ) {
    return 0.94
  }

  const maxLength =
    Math.max(
      x.length,
      y.length
    )

  if (!maxLength) {
    return 1
  }

  return (
    1 -
    levenshtein(x, y) /
      maxLength
  )
}

/* ==========================================================================
   CANDIDATE MATCHING
   ========================================================================== */

function scoreCandidate(
  query: string,
  candidate: string
): number {
  const q = normalize(query)
  const c = normalize(candidate)

  if (!q || !c) {
    return 0
  }

  if (q === c) {
    return 1000
  }

  if (c.includes(q)) {
    return 920
  }

  if (q.includes(c)) {
    return 880
  }

  const queryTokens =
    tokens(q)

  const candidateTokens =
    tokens(c)

  let score = 0
  let matchedTokens = 0

  for (const token of queryTokens) {
    if (token.length < 2) {
      continue
    }

    if (
      candidateTokens.includes(token)
    ) {
      score += 160
      matchedTokens++
      continue
    }

    const prefixMatch =
      candidateTokens.some(
        candidateToken =>
          candidateToken.startsWith(
            token
          ) ||
          token.startsWith(
            candidateToken
          )
      )

    if (prefixMatch) {
      score += 95
      matchedTokens++
      continue
    }

    let bestFuzzy = 0

    for (
      const candidateToken
      of candidateTokens
    ) {
      bestFuzzy = Math.max(
        bestFuzzy,
        similarity(
          token,
          candidateToken
        )
      )
    }

    if (bestFuzzy >= 0.88) {
      score += 90
      matchedTokens++
    } else if (
      bestFuzzy >= 0.80
    ) {
      score += 65
      matchedTokens++
    } else if (
      bestFuzzy >= 0.74
    ) {
      score += 40
      matchedTokens++
    }
  }

  if (queryTokens.length > 0) {
    const coverage =
      matchedTokens /
      queryTokens.length

    score += Math.round(
      coverage * 180
    )
  }

  const wholeSimilarity =
    similarity(q, c)

  if (
    wholeSimilarity >= 0.95
  ) {
    score += 220
  } else if (
    wholeSimilarity >= 0.90
  ) {
    score += 170
  } else if (
    wholeSimilarity >= 0.82
  ) {
    score += 100
  } else if (
    wholeSimilarity >= 0.75
  ) {
    score += 45
  }

  return Math.round(score)
}

function findBestCandidate(
  query: string,
  values: string[],
  minimumScore = 120
): {
  value: string
  score: number
} | null {
  const uniqueValues =
    Array.from(
      new Set(
        values
          .filter(
            (
              value
            ): value is string =>
              typeof value ===
                'string' &&
              value.trim().length >
                0
          )
          .map(value =>
            value.trim()
          )
      )
    )

  if (
    uniqueValues.length === 0
  ) {
    return null
  }

  const results =
    uniqueValues
      .map(value => ({
        value,
        score:
          scoreCandidate(
            query,
            value
          ),
      }))
      .filter(
        item =>
          item.score >=
          minimumScore
      )
      .sort(
        (a, b) =>
          b.score - a.score
      )

  return (
    results[0] ?? null
  )
}

/* ==========================================================================
   NEGATION
   ========================================================================== */

function isNegated(
  query: string,
  position: number
): boolean {
  const before = normalize(
    query.slice(
      Math.max(
        0,
        position - 70
      ),
      position
    )
  )

  return /\b(?:not|no|without|exclude|excluding|except|skip|ignore|minus)\s*$/.test(
    before
  )
}

/* ==========================================================================
   DATE UTILITIES
   ========================================================================== */

function getToday(): Date {
  const now = new Date()

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
}

function formatDate(
  date: Date
): string {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0')

  const day =
    String(
      date.getDate()
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function daysFromToday(
  days: number
): string {
  const date =
    getToday()

  date.setDate(
    date.getDate() + days
  )

  return formatDate(date)
}

/* ==========================================================================
   FLEXIBLE DATE PARSING
   ========================================================================== */

function parseFlexibleDate(
  value: string
): Date | null {
  const text =
    normalize(value)

  const today =
    getToday()

  /* ISO: 2026-08-31 */

  const iso =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    )

  if (iso) {
    const year =
      Number(iso[1])

    const month =
      Number(iso[2]) - 1

    const day =
      Number(iso[3])

    const date =
      new Date(
        year,
        month,
        day
      )

    if (
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        month &&
      date.getDate() ===
        day
    ) {
      return date
    }

    return null
  }

  /* Slash: 08/31/2026 or 31/08/2026 */

  const slash =
    text.match(
      /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/
    )

  if (slash) {
    const first =
      Number(slash[1])

    const second =
      Number(slash[2])

    let year =
      slash[3]
        ? Number(slash[3])
        : today.getFullYear()

    if (
      year < 100
    ) {
      year += 2000
    }

    /*
      Prefer MM/DD when first <= 12.
      Otherwise treat as DD/MM.
    */

    let month: number
    let day: number

    if (
      first <= 12
    ) {
      month = first - 1
      day = second
    } else {
      month = second - 1
      day = first
    }

    const date =
      new Date(
        year,
        month,
        day
      )

    if (
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        month &&
      date.getDate() ===
        day
    ) {
      return date
    }

    return null
  }

  /* Named date */

  const named =
    text.match(
      /^([a-z]+)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?$/
    )

  if (named) {
    const monthName =
      MONTH_ALIASES[
        named[1]
      ]

    if (!monthName) {
      return null
    }

    const monthIndex =
      MONTHS.indexOf(
        monthName
      )

    const year =
      named[3]
        ? Number(named[3])
        : today.getFullYear()

    const day =
      Number(named[2])

    const date =
      new Date(
        year,
        monthIndex,
        day
      )

    if (
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        monthIndex &&
      date.getDate() ===
        day
    ) {
      return date
    }
  }

  return null
}

/* ==========================================================================
   DATE RANGE
   ========================================================================== */

function parseDateRange(
  query: string
): AIFilter | null {
  const text =
    normalize(query)

  /* Today */

  if (
    /\btoday\b/.test(text)
  ) {
    return {
      type: 'dateRange',
      range: 'today',
      label: 'Today',
    }
  }

  /* Yesterday */

  if (
    /\byesterday\b/.test(text)
  ) {
    return {
      type: 'dateRange',
      range: 'yesterday',
      label: 'Yesterday',
    }
  }

  /* Tomorrow */

  if (
    /\btomorrow\b/.test(text)
  ) {
    return {
      type: 'dateRange',
      range: 'tomorrow',
      label: 'Tomorrow',
    }
  }

  /* This week */

  if (
    /\b(?:this|current)\s+week\b/.test(
      text
    )
  ) {
    return {
      type: 'dateRange',
      range: 'this_week',
      label: 'This Week',
    }
  }

  /* Last week */

  if (
    /\b(?:last|previous|past)\s+week\b/.test(
      text
    )
  ) {
    return {
      type: 'dateRange',
      range: 'last_week',
      label: 'Last Week',
    }
  }

  /* Next week */

  if (
    /\bnext\s+week\b/.test(
      text
    )
  ) {
    return {
      type: 'dateRange',
      range: 'next_week',
      label: 'Next Week',
    }
  }

  /* This month */

  if (
    /\b(?:this|current)\s+month\b/.test(
      text
    )
  ) {
    return {
      type: 'dateRange',
      range: 'this_month',
      label: 'This Month',
    }
  }

  /* Last month */

  if (
    /\b(?:last|previous|past)\s+month\b/.test(
      text
    )
  ) {
    return {
      type: 'dateRange',
      range: 'last_month',
      label: 'Last Month',
    }
  }

  /* Next month */

  if (
    /\bnext\s+month\b/.test(
      text
    )
  ) {
    return {
      type: 'dateRange',
      range: 'next_month',
      label: 'Next Month',
    }
  }

  /* This quarter */

  if (
    /\b(?:this|current)\s+quarter\b/.test(
      text
    )
  ) {
    return {
      type: 'dateRange',
      range: 'this_quarter',
      label: 'This Quarter',
    }
  }

  /* Last quarter */

  if (
    /\b(?:last|previous|past)\s+quarter\b/.test(
      text
    )
  ) {
    return {
      type: 'dateRange',
      range: 'last_quarter',
      label: 'Last Quarter',
    }
  }

  /* This year / YTD */

  if (
    /\b(?:this|current)\s+year\b/.test(
      text
    ) ||
    /\bytd\b/.test(text) ||
    /\byear\s+to\s+date\b/.test(
      text
    )
  ) {
    return {
      type: 'dateRange',
      range: 'this_year',
      label: 'This Year',
    }
  }

  /* Last year */

  if (
    /\b(?:last|previous|past)\s+year\b/.test(
      text
    )
  ) {
    return {
      type: 'dateRange',
      range: 'last_year',
      label: 'Last Year',
    }
  }

  /* ------------------------------------------------------------------------
     Last N days/weeks/months
     ------------------------------------------------------------------------ */

  const lastN =
    text.match(
      /\b(?:last|past|previous|prior|within|over|during)\s+(\d+)\s+(days?|weeks?|months?|quarters?)\b/
    )

  if (lastN) {
    const amount =
      Number(lastN[1])

    const unit =
      lastN[2]

    if (
      Number.isFinite(amount) &&
      amount > 0 &&
      amount <= 3650
    ) {
      let days =
        amount

      if (
        unit.startsWith('week')
      ) {
        days =
          amount * 7
      } else if (
        unit.startsWith('month')
      ) {
        days =
          amount * 30
      } else if (
        unit.startsWith('quarter')
      ) {
        days =
          amount * 90
      }

      return {
        type: 'dateRange',
        range: 'last_n_days',
        days,
        label:
          `Last ${amount} ${unit}`,
      }
    }
  }

  /* ------------------------------------------------------------------------
     Next N days/weeks
     ------------------------------------------------------------------------ */

  const nextN =
    text.match(
      /\bnext\s+(\d+)\s+(days?|weeks?|months?)\b/
    )

  if (nextN) {
    const amount =
      Number(nextN[1])

    const unit =
      nextN[2]

    if (
      Number.isFinite(amount) &&
      amount > 0 &&
      amount <= 3650
    ) {
      let days =
        amount

      if (
        unit.startsWith('week')
      ) {
        days =
          amount * 7
      } else if (
        unit.startsWith('month')
      ) {
        days =
          amount * 30
      }

      return {
        type: 'dateRange',
        range: 'next_n_days',
        days,
        label:
          `Next ${amount} ${unit}`,
      }
    }
  }

  /* ------------------------------------------------------------------------
     Explicit ranges
     ------------------------------------------------------------------------ */

  const datePattern =
    '(?:[a-z]+\\s+\\d{1,2}(?:\\s*,?\\s*\\d{4})?|\\d{4}-\\d{1,2}-\\d{1,2}|\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?)'

  const rangeRegex =
    new RegExp(
      `(?:from\\s+)?(${datePattern})\\s+(?:to|until|through|thru|-)\\s+(${datePattern})`,
      'i'
    )

  const rangeMatch =
    text.match(
      rangeRegex
    )

  if (rangeMatch) {
    const start =
      parseFlexibleDate(
        rangeMatch[1]
      )

    const end =
      parseFlexibleDate(
        rangeMatch[2]
      )

    if (
      start &&
      end
    ) {
      const startTime =
        start.getTime()

      const endTime =
        end.getTime()

      const [
        first,
        second,
      ] =
        startTime <= endTime
          ? [start, end]
          : [end, start]

      return {
        type: 'dateRange',
        value:
          `${formatDate(first)}:${formatDate(second)}`,
        label:
          `${formatDate(first)} → ${formatDate(second)}`,
      }
    }
  }

  /* ------------------------------------------------------------------------
     Single date
     ------------------------------------------------------------------------ */

  const singleRegex =
    new RegExp(
      `\\b(?:on|for|dated?|date)\\s+(${datePattern})\\b`,
      'i'
    )

  const singleMatch =
    text.match(
      singleRegex
    )

  if (singleMatch) {
    const date =
      parseFlexibleDate(
        singleMatch[1]
      )

    if (date) {
      const formatted =
        formatDate(date)

      return {
        type: 'dateRange',
        value:
          `${formatted}:${formatted}`,
        label: formatted,
      }
    }
  }

  return null
}

/* ==========================================================================
   MONTH PARSER
   ========================================================================== */

function parseMonth(
  query: string
): AIFilter | null {
  const text =
    normalize(query)

  if (
    /\b(?:this|current|last|previous|next)\s+month\b/.test(
      text
    )
  ) {
    return null
  }

  for (
    const month of MONTHS
  ) {
    const normalized =
      normalize(month)

    if (
      new RegExp(
        `\\b${escapeRegex(normalized)}\\b`,
        'i'
      ).test(text)
    ) {
      return {
        type: 'month',
        value: month,
        label: month,
      }
    }
  }

  for (
    const [alias, month]
    of Object.entries(
      MONTH_ALIASES
    )
  ) {
    if (
      new RegExp(
        `\\b${escapeRegex(alias)}\\b`,
        'i'
      ).test(text)
    ) {
      return {
        type: 'month',
        value: month,
        label: month,
      }
    }
  }

  return null
}

/* ==========================================================================
   DISPATCH STATUS
   ========================================================================== */

function parseDispatchStatus(
  query: string
): AIFilter | null {
  const text =
    normalize(query)

  /*
    IMPORTANT:
    Short/incomplete is checked before complete.
    This prevents "not complete" from accidentally
    being interpreted as "complete".
  */

  if (
    hasPhrase(
      text,
      STATUS_SHORT
    )
  ) {
    return {
      type: 'dispatchStatus',
      status: 'short',
      label: 'Short Dispatch',
    }
  }

  if (
    hasPhrase(
      text,
      STATUS_NOT_COMPLETE
    )
  ) {
    return {
      type: 'dispatchStatus',
      status: 'complete',
      negate: true,
      label: 'Not Complete',
    }
  }

  if (
    hasPhrase(
      text,
      STATUS_COMPLETE
    )
  ) {
    return {
      type: 'dispatchStatus',
      status: 'complete',
      label: 'Complete',
    }
  }

  return null
}

/* ==========================================================================
   MANIFEST STATUS
   ========================================================================== */

function parseManifestStatus(
  query: string
): AIFilter | null {
  const text =
    normalize(query)

  if (
    hasPhrase(
      text,
      MANIFEST_STATUS_DRAFT
    )
  ) {
    return {
      type: 'manifestStatus',
      status: 'draft',
      label: 'Draft',
    }
  }

  if (
    hasPhrase(
      text,
      MANIFEST_STATUS_COMPLETED
    )
  ) {
    return {
      type: 'manifestStatus',
      status: 'completed',
      label: 'Completed',
    }
  }

  return null
}

/* ==========================================================================
   DOCUMENTS
   ========================================================================== */

function parseDocuments(
  query: string
): AIFilter | null {
  const text =
    normalize(query)

  if (
    hasPhrase(
      text,
      NO_DOCUMENTS
    )
  ) {
    return {
      type: 'noDocuments',
      label: 'No Documents',
    }
  }

  if (
    hasPhrase(
      text,
      HAS_DOCUMENTS
    )
  ) {
    return {
      type: 'noDocuments',
      negate: true,
      label: 'Has Documents',
    }
  }

  return null
}

/* ==========================================================================
   NUMERIC FILTER
   ========================================================================== */

function parseNumericFilter(
  query: string,
  type: 'qty' | 'cbm'
): AIFilter | null {
  const text =
    normalize(query)

  const unit =
    type === 'qty'
      ? '(?:units?|pcs?|pieces?|qty|quantity)?'
      : '(?:cbm|cubic\\s+meters?|cubic\\s+meter)?'

  /* ------------------------------------------------------------------------
     Between X and Y
     ------------------------------------------------------------------------ */

  const between =
    text.match(
      new RegExp(
        `\\bbetween\\s+(\\d+(?:\\.\\d+)?)\\s+(?:and|to)\\s+(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`,
        'i'
      )
    )

  if (between) {
    const a =
      Number(between[1])

    const b =
      Number(between[2])

    const min =
      Math.min(a, b)

    const max =
      Math.max(a, b)

    return {
      type,
      min,
      max,
      label:
        type === 'qty'
          ? `Qty ${min}–${max}`
          : `CBM ${min}–${max}`,
    }
  }

  /* ------------------------------------------------------------------------
     X to Y
     ------------------------------------------------------------------------ */

  const range =
    text.match(
      new RegExp(
        `\\b(\\d+(?:\\.\\d+)?)\\s*(?:-|to|through|thru|–|—)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`,
        'i'
      )
    )

  if (range) {
    const a =
      Number(range[1])

    const b =
      Number(range[2])

    const min =
      Math.min(a, b)

    const max =
      Math.max(a, b)

    return {
      type,
      min,
      max,
      label:
        type === 'qty'
          ? `Qty ${min}–${max}`
          : `CBM ${min}–${max}`,
    }
  }

  /* ------------------------------------------------------------------------
     Greater than
     ------------------------------------------------------------------------ */

  const greater =
    text.match(
      new RegExp(
        `\\b(?:more than|greater than|over|above|exceeding|exceeds|gt)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`,
        'i'
      )
    )

  if (greater) {
    const value =
      Number(greater[1])

    return {
      type,
      min: value,
      label:
        type === 'qty'
          ? `Qty > ${value}`
          : `CBM > ${value}`,
    }
  }

  /* ------------------------------------------------------------------------
     At least
     ------------------------------------------------------------------------ */

  const atLeast =
    text.match(
      new RegExp(
        `\\b(?:at least|minimum|min|gte)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`,
        'i'
      )
    )

  if (atLeast) {
    const value =
      Number(atLeast[1])

    return {
      type,
      min: value,
      label:
        type === 'qty'
          ? `Qty ≥ ${value}`
          : `CBM ≥ ${value}`,
    }
  }

  /* ------------------------------------------------------------------------
     Less than
     ------------------------------------------------------------------------ */

  const less =
    text.match(
      new RegExp(
        `\\b(?:less than|under|below|lt)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`,
        'i'
      )
    )

  if (less) {
    const value =
      Number(less[1])

    return {
      type,
      max: value,
      label:
        type === 'qty'
          ? `Qty < ${value}`
          : `CBM < ${value}`,
    }
  }

  /* ------------------------------------------------------------------------
     At most
     ------------------------------------------------------------------------ */

  const atMost =
    text.match(
      new RegExp(
        `\\b(?:at most|maximum|max|no more than|lte)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`,
        'i'
      )
    )

  if (atMost) {
    const value =
      Number(atMost[1])

    return {
      type,
      max: value,
      label:
        type === 'qty'
          ? `Qty ≤ ${value}`
          : `CBM ≤ ${value}`,
    }
  }

  /* ------------------------------------------------------------------------
     X or more
     ------------------------------------------------------------------------ */

  if (type === 'qty') {
    const orMore =
      text.match(
        /\b(\d+(?:\.\d+)?)\s*(?:or more|\+)\s*(?:units?|pcs?|pieces?)?\b/
      )

    if (orMore) {
      const value =
        Number(orMore[1])

      return {
        type: 'qty',
        min: value,
        label:
          `Qty ≥ ${value}`,
      }
    }

    /* X or less */

    const orLess =
      text.match(
        /\b(\d+(?:\.\d+)?)\s+or\s+less\b/
      )

    if (orLess) {
      const value =
        Number(orLess[1])

      return {
        type: 'qty',
        max: value,
        label:
          `Qty ≤ ${value}`,
      }
    }
  }

  /* ------------------------------------------------------------------------
     Explicit exact quantity
     ------------------------------------------------------------------------ */

  if (type === 'qty') {
    const exact =
      text.match(
        /\b(?:quantity|qty|exactly|equal to)\s*(?:is\s*)?(\d+(?:\.\d+)?)\b/
      )

    if (exact) {
      const value =
        Number(exact[1])

      return {
        type: 'qty',
        min: value,
        max: value,
        label:
          `Qty = ${value}`,
      }
    }

    /* ----------------------------------------------------------------------
       Standalone "500 units"
       ---------------------------------------------------------------------- */

    const standalone =
      text.match(
        /\b(\d+(?:\.\d+)?)\s*(?:units?|pcs?|pieces?)\b/
      )

    if (standalone) {
      const value =
        Number(standalone[1])

      return {
        type: 'qty',
        min: value,
        max: value,
        label:
          `Qty = ${value}`,
      }
    }
  }

  /* ------------------------------------------------------------------------
     Exact CBM
     ------------------------------------------------------------------------ */

  if (type === 'cbm') {
    const exact =
      text.match(
        /\b(?:cbm|cubic meters?|volume)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\b/
      )

    if (exact) {
      const value =
        Number(exact[1])

      return {
        type: 'cbm',
        min: value,
        max: value,
        label:
          `CBM = ${value}`,
      }
    }
  }

  return null
}

/* ==========================================================================
   IDENTIFIERS
   ========================================================================== */

function parseIdentifier(
  query: string,
  patterns: Array<{
    type: AIFilter['type']
    label: string
    regex: RegExp
  }>
): AIFilter | null {
  for (
    const pattern
    of patterns
  ) {
    const match =
      query.match(
        pattern.regex
      )

    if (!match) {
      continue
    }

    const value =
      match[1]
        .trim()
        .replace(
          /\s+/g,
          ' '
        )

    if (!value) {
      continue
    }

    const normalized =
      value.toUpperCase()

    return {
      type: pattern.type,
      value: normalized,
      label:
        `${pattern.label} ${normalized}`,
    }
  }

  return null
}

/* ==========================================================================
   PLATE
   ========================================================================== */

function parsePlate(
  query: string
): AIFilter | null {
  return parseIdentifier(
    query,
    [
      {
        type: 'plate',
        label: 'Plate',
        regex:
          /\b(?:plate|plate number|plate no|plate#|vehicle plate|license plate|registration|reg)\s*[:#-]?\s*([A-Za-z0-9-]{3,15})\b/i,
      },
    ]
  )
}

/* ==========================================================================
   CONTAINER
   ========================================================================== */

function parseContainer(
  query: string
): AIFilter | null {
  return parseIdentifier(
    query,
    [
      {
        type: 'container',
        label: 'Container',
        regex:
          /\b(?:container|cntr|container number|container no|container#|van number|van no)\s*[:#-]?\s*([A-Za-z0-9-]{4,20})\b/i,
      },
    ]
  )
}

/* ==========================================================================
   SEAL
   ========================================================================== */

function parseSeal(
  query: string
): AIFilter | null {
  return parseIdentifier(
    query,
    [
      {
        type: 'seal',
        label: 'Seal',
        regex:
          /\b(?:seal|seal no|seal number|seal#)\s*[:#-]?\s*([A-Za-z0-9-]{3,20})\b/i,
      },
    ]
  )
}

/* ==========================================================================
   FREE TEXT
   ========================================================================== */

function parseFreeText(
  query: string
): AIFilter[] {
  const filters: AIFilter[] = []

  const patterns = [
    {
      regex:
        /\b(?:dn|delivery note|delivery number|delivery no|del note)\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
      label: 'DN',
    },

    {
      regex:
        /\b(?:manifest|manifest no|manifest number|manifest#|tm)\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
      label: 'Manifest',
    },

    {
      regex:
        /\b(?:reference|ref|ref no|ref#|reference number)\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
      label: 'Reference',
    },

    {
      regex:
        /\b(?:material|sku|item|product|part|part number|part#|mat code)\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
      label: 'Material',
    },

    {
      regex:
        /\b(?:po|purchase order|po number|po#)\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
      label: 'PO',
    },

    {
      regex:
        /\b(?:bol|bill of lading|b\/l)\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
      label: 'BOL',
    },

    {
      regex:
        /\b(?:invoice|inv|invoice number|inv#)\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
      label: 'Invoice',
    },

    {
      regex:
        /\b(?:load|trip|shipment|order|job)\s*(?:id|#|no|number)?\s*[:#-]?\s*([A-Za-z0-9-]{4,})\b/i,
      label: 'ID',
    },
  ]

  for (
    const pattern
    of patterns
  ) {
    const match =
      query.match(
        pattern.regex
      )

    if (!match) {
      continue
    }

    const value =
      match[1]

    const duplicate =
      filters.some(
        filter =>
          filter.value ===
          value
      )

    if (!duplicate) {
      filters.push({
        type: 'freeText',
        value,
        label:
          `${pattern.label}: ${value}`,
      })
    }
  }

  return filters
}

/* ==========================================================================
   SHIP TO
   ========================================================================== */

function parseShipTo(
  query: string,
  candidates: string[]
): AIFilter | null {
  if (
    !candidates.length
  ) {
    return null
  }

  const match =
    query.match(
      /\b(?:ship\s*to|shipto|consignee|customer|sold\s*to|deliver\s*to)\s*[:#-]?\s*([^,;]+?)(?=\s+(?:in|on|at|with|from|for|and|or|last|this|next|over|under)\b|$)/i
    )

  if (!match) {
    return null
  }

  const best =
    findBestCandidate(
      match[1].trim(),
      candidates,
      100
    )

  if (!best) {
    return null
  }

  return {
    type: 'shipTo',
    value: best.value,
    label:
      `Ship To: ${best.value}`,
  }
}

/* ==========================================================================
   ENTITY PARSER
   ========================================================================== */

function parseEntity(
  query: string,
  type:
    | 'driver'
    | 'trucker'
    | 'truckType',
  values: string[]
): AIFilter | null {
  if (
    !values.length
  ) {
    return null
  }

  const keywords =
    type === 'driver'
      ? DRIVER_KEYWORDS
      : type === 'trucker'
        ? TRUCKER_KEYWORDS
        : TRUCK_TYPE_KEYWORDS

  const normalizedQuery =
    normalize(query)

  /*
    First attempt:
    explicit entity keyword.

    Example:
      driver Juan
      carrier ABC Logistics
      truck type 10 Wheeler
  */

  for (
    const keyword
    of keywords
  ) {
    const normalizedKeyword =
      normalize(keyword)

    const index =
      normalizedQuery.indexOf(
        normalizedKeyword
      )

    if (
      index === -1
    ) {
      continue
    }

    let after =
      normalizedQuery.slice(
        index +
          normalizedKeyword.length
      )

    after =
      after
        .replace(
          /^[\s:,-]+/,
          ''
        )
        .trim()

    if (!after) {
      continue
    }

    /*
      Stop the candidate before another
      query operator.
    */

    const words =
      after.split(/\s+/)

    const collected: string[] = []

    for (
      const word of words
    ) {
      if (
        ENTITY_STOP_WORDS.includes(
          word
        )
      ) {
        break
      }

      collected.push(word)
    }

    const cleaned =
      collected.join(' ').trim()

    if (!cleaned) {
      continue
    }

    const best =
      findBestCandidate(
        cleaned,
        values,
        90
      )

    if (!best) {
      continue
    }

    return {
      type,
      value: best.value,
      negate:
        isNegated(
          query,
          index
        ) ||
        undefined,
      label:
        type === 'driver'
          ? `Driver: ${best.value}`
          : type === 'trucker'
            ? `Trucker: ${best.value}`
            : `Truck Type: ${best.value}`,
    }
  }

  /*
    Strong fuzzy fallback.

    We intentionally use a high threshold here
    so random words don't become entities.
  */

  const best =
    findBestCandidate(
      query,
      values,
      350
    )

  if (!best) {
    return null
  }

  return {
    type,
    value: best.value,
    label:
      type === 'driver'
        ? `Driver: ${best.value}`
        : type === 'trucker'
          ? `Trucker: ${best.value}`
          : `Truck Type: ${best.value}`,
  }
}

/* ==========================================================================
   SORT
   ========================================================================== */

function parseSort(
  query: string
): 'asc' | 'desc' | null {
  const text =
    normalize(query)

  if (
    hasPhrase(
      text,
      SORT_DESC
    )
  ) {
    return 'desc'
  }

  if (
    hasPhrase(
      text,
      SORT_ASC
    )
  ) {
    return 'asc'
  }

  /*
    Natural language:
      sort descending
      sort ascending
      sort newest
      sort oldest
  */

  if (
    /\bsort\s+(?:by\s+)?(?:newest|latest|recent)\b/.test(
      text
    )
  ) {
    return 'desc'
  }

  if (
    /\bsort\s+(?:by\s+)?(?:oldest|earliest)\b/.test(
      text
    )
  ) {
    return 'asc'
  }

  return null
}

/* ==========================================================================
   EXPLICIT ENTITY DETECTION
   ========================================================================== */

function hasExplicitKeyword(
  query: string,
  keywords: string[]
): boolean {
  const text =
    normalize(query)

  return keywords.some(
    keyword =>
      text.includes(
        normalize(keyword)
      )
  )
}

/* ==========================================================================
   CONFLICT DETECTION
   ========================================================================== */

function detectConflicts(
  query: string
): string[] {
  const warnings: string[] = []

  const text =
    normalize(query)

  const complete =
    hasPhrase(
      text,
      STATUS_COMPLETE
    )

  const incomplete =
    hasPhrase(
      text,
      STATUS_NOT_COMPLETE
    )

  const short =
    hasPhrase(
      text,
      STATUS_SHORT
    )

  if (
    complete &&
    incomplete
  ) {
    warnings.push(
      'Conflicting dispatch statuses detected: complete and incomplete.'
    )
  }

  if (
    complete &&
    short
  ) {
    warnings.push(
      'Conflicting dispatch statuses detected: complete and short.'
    )
  }

  const draft =
    hasPhrase(
      text,
      MANIFEST_STATUS_DRAFT
    )

  const completedManifest =
    hasPhrase(
      text,
      MANIFEST_STATUS_COMPLETED
    )

  if (
    draft &&
    completedManifest
  ) {
    warnings.push(
      'Conflicting manifest statuses detected: draft and completed.'
    )
  }

  return warnings
}

/* ==========================================================================
   MAIN PARSER
   ========================================================================== */

function parseManualAI(
  query: string,
  candidates: {
    truckers: string[]
    drivers: string[]
    truckTypes: string[]
    shipTos?: string[]
  }
): AIResult {
  const filters: AIFilter[] = []
  const matched: string[] = []
  const warnings =
    detectConflicts(query)

  const text =
    query.trim()

  const normalized =
    normalize(text)

  if (!normalized) {
    return {
      filters: [],
      sortDir: null,
      confidence: 0,
    }
  }

  /* =========================================================================
     DATE
     ========================================================================= */

  const dateRange =
    parseDateRange(text)

  if (dateRange) {
    addFilter(
      filters,
      dateRange
    )

    if (dateRange.label) {
      matched.push(
        dateRange.label
      )
    }
  }

  const month =
    parseMonth(text)

  if (month) {
    addFilter(
      filters,
      month
    )

    if (month.label) {
      matched.push(
        month.label
      )
    }
  }

  /* =========================================================================
     DISPATCH STATUS
     ========================================================================= */

  const dispatchStatus =
    parseDispatchStatus(text)

  if (dispatchStatus) {
    /*
      Don't add an ambiguous status if
      multiple contradictory statuses were found.
    */

    const hasConflict =
      warnings.some(
        warning =>
          warning.includes(
            'Conflicting dispatch'
          )
      )

    if (!hasConflict) {
      addFilter(
        filters,
        dispatchStatus
      )

      if (
        dispatchStatus.label
      ) {
        matched.push(
          dispatchStatus.label
        )
      }
    }
  }

  /* =========================================================================
     MANIFEST STATUS
     ========================================================================= */

  const manifestStatus =
    parseManifestStatus(text)

  if (manifestStatus) {
    const hasConflict =
      warnings.some(
        warning =>
          warning.includes(
            'Conflicting manifest'
          )
      )

    if (!hasConflict) {
      addFilter(
        filters,
        manifestStatus
      )

      if (
        manifestStatus.label
      ) {
        matched.push(
          manifestStatus.label
        )
      }
    }
  }

  /* =========================================================================
     DOCUMENTS
     ========================================================================= */

  const documents =
    parseDocuments(text)

  if (documents) {
    addFilter(
      filters,
      documents
    )

    if (documents.label) {
      matched.push(
        documents.label
      )
    }
  }

  /* =========================================================================
     QUANTITY
     ========================================================================= */

  const quantity =
    parseNumericFilter(
      text,
      'qty'
    )

  if (quantity) {
    addFilter(
      filters,
      quantity
    )

    if (quantity.label) {
      matched.push(
        quantity.label
      )
    }
  }

  /* =========================================================================
     CBM
     ========================================================================= */

  /*
    Only parse CBM when the query actually
    contains a CBM/volume-related term.

    This prevents "20" from accidentally
    becoming CBM.
  */

  if (
    /\b(?:cbm|cubic|volume)\b/i.test(
      text
    )
  ) {
    const cbm =
      parseNumericFilter(
        text,
        'cbm'
      )

    if (cbm) {
      addFilter(
        filters,
        cbm
      )

      if (cbm.label) {
        matched.push(
          cbm.label
        )
      }
    }
  }

  /* =========================================================================
     PLATE
     ========================================================================= */

  const plate =
    parsePlate(text)

  if (plate) {
    addFilter(
      filters,
      plate
    )

    if (plate.label) {
      matched.push(
        plate.label
      )
    }
  }

  /* =========================================================================
     CONTAINER
     ========================================================================= */

  const container =
    parseContainer(text)

  if (container) {
    addFilter(
      filters,
      container
    )

    if (
      container.label
    ) {
      matched.push(
        container.label
      )
    }
  }

  /* =========================================================================
     SEAL
     ========================================================================= */

  const seal =
    parseSeal(text)

  if (seal) {
    addFilter(
      filters,
      seal
    )

    if (seal.label) {
      matched.push(
        seal.label
      )
    }
  }

  /* =========================================================================
     SHIP TO
     ========================================================================= */

  const shipTo =
    parseShipTo(
      text,
      candidates.shipTos ||
        []
    )

  if (shipTo) {
    addFilter(
      filters,
      shipTo
    )

    if (
      shipTo.label
    ) {
      matched.push(
        shipTo.label
      )
    }
  }

  /* =========================================================================
     ENTITIES
     ========================================================================= */

  const explicitDriver =
    hasExplicitKeyword(
      text,
      DRIVER_KEYWORDS
    )

  const explicitTrucker =
    hasExplicitKeyword(
      text,
      TRUCKER_KEYWORDS
    )

  const explicitTruckType =
    hasExplicitKeyword(
      text,
      TRUCK_TYPE_KEYWORDS
    )

  const driver =
    parseEntity(
      text,
      'driver',
      candidates.drivers
    )

  const trucker =
    parseEntity(
      text,
      'trucker',
      candidates.truckers
    )

  const truckType =
    parseEntity(
      text,
      'truckType',
      candidates.truckTypes
    )

  /*
    Explicit driver.
  */

  if (
    explicitDriver &&
    driver
  ) {
    addFilter(
      filters,
      driver
    )

    if (driver.label) {
      matched.push(
        driver.label
      )
    }
  }

  /*
    Explicit trucker.
  */

  if (
    explicitTrucker &&
    trucker
  ) {
    addFilter(
      filters,
      trucker
    )

    if (trucker.label) {
      matched.push(
        trucker.label
      )
    }
  }

  /*
    Explicit truck type.
  */

  if (
    explicitTruckType &&
    truckType
  ) {
    addFilter(
      filters,
      truckType
    )

    if (
      truckType.label
    ) {
      matched.push(
        truckType.label
      )
    }
  }

  /* =========================================================================
     FUZZY ENTITY FALLBACK
     ========================================================================= */

  if (
    !explicitDriver &&
    !explicitTrucker &&
    !explicitTruckType
  ) {
    const possibleMatches: Array<{
      filter: AIFilter
      score: number
    }> = []

    if (
      driver?.value
    ) {
      possibleMatches.push({
        filter: driver,
        score:
          scoreCandidate(
            text,
            driver.value
          ),
      })
    }

    if (
      trucker?.value
    ) {
      possibleMatches.push({
        filter: trucker,
        score:
          scoreCandidate(
            text,
            trucker.value
          ),
      })
    }

    if (
      truckType?.value
    ) {
      possibleMatches.push({
        filter: truckType,
        score:
          scoreCandidate(
            text,
            truckType.value
          ),
      })
    }

    possibleMatches.sort(
      (a, b) =>
        b.score - a.score
    )

    /*
      Only accept a fuzzy entity when
      the score is very strong.
    */

    if (
      possibleMatches[0] &&
      possibleMatches[0].score >=
        360
    ) {
      addFilter(
        filters,
        possibleMatches[0].filter
      )

      if (
        possibleMatches[0]
          .filter.label
      ) {
        matched.push(
          possibleMatches[0]
            .filter.label!
        )
      }
    }

    /*
      Second entity requires an
      exceptionally strong score.
    */

    if (
      possibleMatches[1] &&
      possibleMatches[0] &&
      possibleMatches[1].score >=
        450 &&
      possibleMatches[1].filter.type !==
        possibleMatches[0].filter.type
    ) {
      addFilter(
        filters,
        possibleMatches[1].filter
      )

      if (
        possibleMatches[1]
          .filter.label
      ) {
        matched.push(
          possibleMatches[1]
            .filter.label!
        )
      }
    }
  }

  /* =========================================================================
     FREE TEXT
     ========================================================================= */

  const freeText =
    parseFreeText(text)

  for (
    const filter
    of freeText
  ) {
    addFilter(
      filters,
      filter
    )

    if (
      filter.label
    ) {
      matched.push(
        filter.label
      )
    }
  }

  /* =========================================================================
     SORT
     ========================================================================= */

  const sortDir =
    parseSort(text)

  if (sortDir) {
    matched.push(
      sortDir === 'desc'
        ? 'Newest First'
        : 'Oldest First'
    )
  }

  /* =========================================================================
     CONFIDENCE
     ========================================================================= */

  let confidence =
    0.15

  /*
    No filter = low confidence.
  */

  if (
    filters.length === 0
  ) {
    confidence = 0.05

    warnings.push(
      'No structured filter could be confidently identified.'
    )
  }

  /*
    Structured filters.
  */

  if (
    filters.length >= 1
  ) {
    confidence += 0.25
  }

  if (
    filters.length >= 2
  ) {
    confidence += 0.15
  }

  if (
    filters.length >= 3
  ) {
    confidence += 0.10
  }

  if (
    filters.length >= 5
  ) {
    confidence += 0.05
  }

  /*
    High-confidence filter types.
  */

  if (
    dateRange
  ) {
    confidence += 0.08
  }

  if (
    freeText.length > 0
  ) {
    confidence += 0.08
  }

  if (
    plate ||
    container ||
    seal
  ) {
    confidence += 0.08
  }

  if (
    sortDir
  ) {
    confidence += 0.05
  }

  /*
    Penalize conflicts.
  */

  if (
    warnings.length > 0
  ) {
    confidence -=
      Math.min(
        0.35,
        warnings.length *
          0.15
      )
  }

  /*
    If we matched multiple structured
    concepts, confidence increases.
  */

  if (
    matched.length >= 2
  ) {
    confidence += 0.05
  }

  if (
    matched.length >= 4
  ) {
    confidence += 0.05
  }

  /*
    Clamp 0–1.
  */

  confidence =
    Math.max(
      0,
      Math.min(
        1,
        confidence
      )
    )

  confidence =
    Math.round(
      confidence * 100
    ) / 100

  return {
    filters,
    sortDir,
    confidence,
    matched,
    warnings,
  }
}

/* ==========================================================================
   POST
   ========================================================================== */

export async function POST(
  req: NextRequest
) {
  let body:
    AISearchRequestBody

  try {
    body =
      await req.json()
  } catch {
    return NextResponse.json(
      {
        error:
          'Invalid request body.',
      },
      {
        status: 400,
      }
    )
  }

  const query =
    String(
      body.query || ''
    )
      .trim()
      .slice(
        0,
        MAX_QUERY_LENGTH
      )

  if (!query) {
    return NextResponse.json({
      filters: [],
      sortDir: null,
      confidence: 0,
    })
  }

  const truckers =
    Array.isArray(
      body.truckers
    )
      ? body.truckers
      : []

  const drivers =
    Array.isArray(
      body.drivers
    )
      ? body.drivers
      : []

  const truckTypes =
    Array.isArray(
      body.truckTypes
    )
      ? body.truckTypes
      : []

  const shipTos =
    Array.isArray(
      body.shipTos
    )
      ? body.shipTos
      : []

  try {
    const result =
      parseManualAI(
        query,
        {
          truckers,
          drivers,
          truckTypes,
          shipTos,
        }
      )

    return NextResponse.json(
      result
    )
  } catch (error) {
    console.error(
      'Manual AI parser error:',
      error
    )

    return NextResponse.json(
      {
        filters: [],
        sortDir: null,
        confidence: 0,
        matched: [],
        warnings: [
          'Parser error while processing query.',
        ],
      },
      {
        status: 200,
      }
    )
  }
}
