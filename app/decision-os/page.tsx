import type { Metadata } from 'next'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { DECISION_CAPTURE_BOUNDARY, DECISION_CAPTURE_FIELDS } from '@/lib/services/decision-capture'
import DecisionCaptureClient from './DecisionCaptureClient'

export const metadata: Metadata = {
  title: 'Decision OS v0.1 | Salon Growth OS',
  description: 'Non-canonical Decision OS prototype',
}

export default function DecisionOsPage() {
  const coreFields = DECISION_CAPTURE_FIELDS.filter((field) => field.isCoreDecisionField)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B1220] pb-20">
        <Navigation />
        <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
          <header>
            <p className="text-[#D4AF37] text-xs font-bold">Decision OS v0.1</p>
            <h1 className="text-lg font-semibold text-[#E6ECF5]">Decision structure prototype</h1>
            <p className="text-[#8B94A7] text-xs mt-1">
              non-canonical development aid。日常入力導線ではなく、Decision構造とUIの検証用です。
            </p>
          </header>

          <DecisionCaptureClient />

          <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
            <h2 className="text-[#E6ECF5] text-base font-bold">Source boundary</h2>
            <div className="mt-3 space-y-2 text-sm">
              <BoundaryRow label="Canonical" value={DECISION_CAPTURE_BOUNDARY.canonicalSourceLabel} />
              <BoundaryRow label="Storage" value="none / local browser state only" />
              <BoundaryRow label="Flow" value="Ikeda -> ChatGPT -> canonical owner" />
              <BoundaryRow label="PII" value="real names, contacts, photos, and detailed identifiers stay out" />
              <BoundaryRow label="Notion" value="Strategic Decision Log only, not customer salon Decisions" />
            </div>
          </section>

          <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
            <h2 className="text-[#E6ECF5] text-base font-bold">Later linkage</h2>
            <p className="mt-2 text-xs text-[#8B94A7]">
              Professional Hypothesis remains optional and separate from the core 5. Outcome and retrieval should attach later only after field validation.
            </p>
            <div className="mt-3 space-y-3">
              {coreFields.map((field) => (
                <div key={field.key} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
                  <p className="text-[#D4AF37] text-xs font-bold">{field.shortLabel}</p>
                  <p className="text-[#8B94A7] text-xs mt-1">
                    #13: {field.issue13Linkage ?? 'no direct lifecycle field yet'}
                  </p>
                  <p className="text-[#8B94A7] text-xs mt-1">
                    #14: {field.issue14RetrievalRole ?? 'no retrieval role yet'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  )
}

function BoundaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-white/10 pt-2 first:border-t-0 first:pt-0">
      <span className="text-[#8B94A7]">{label}</span>
      <span className="max-w-[68%] text-right text-[#E6ECF5]">{value}</span>
    </div>
  )
}
