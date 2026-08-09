<script lang="ts">
  import BookOpen from '@lucide/svelte/icons/book-open';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import { evidenceLedger, practiceById } from '$lib/data';
</script>
<details class="evidence-ledger"><summary><span><BookOpen /><b>Open the evidence and safety ledger</b><small>Intended use, evidence family, cautions, exclusions, review date, and primary sources for all eight practices.</small></span><ChevronDown /></summary>
  <div class="ledger-body"><div class="ledger-intro"><div><span class="eyebrow coral">Evidence without overclaiming</span><h2>Every practice has a paper trail.</h2></div><p>All entries are literature-informed and not clinician reviewed. Sources support a rationale or evidence family—not the efficacy of Unspool’s exact sequence.</p></div>
    <div class="ledger-grid">{#each evidenceLedger as entry}<article><div class="ledger-card-top"><span>{entry.evidenceLevel}</span><small>Reviewed {entry.reviewedAt}</small></div><h3>{practiceById.get(entry.id)?.name}</h3><p><b>Intended use.</b> {entry.intendedUse}</p><p><b>{entry.evidenceFamily}.</b> {entry.summary}</p><p><b>Caution.</b> {entry.caution}</p><p><b>Constraint logic.</b> {entry.contraindication}</p><small class="review-status">{entry.reviewStatus}</small><div class="ledger-sources">{#each entry.sources as source}<a href={source.url} target="_blank" rel="noreferrer">{source.label} <ExternalLink size={12} /></a>{/each}</div></article>{/each}</div>
  </div>
</details>
