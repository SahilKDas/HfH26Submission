import { MODEL_SPEC, type NeedId, type SignalId } from '$shared/model';

export interface Step { time: number; title: string; body: string; }
export interface PracticeContent { id: string; name: string; short: string; steps: Step[]; bridge: string; why: string; cautions: string[]; }
export type Practice = (typeof MODEL_SPEC)[number] & PracticeContent;

const content: PracticeContent[] = [
  { id: 'orient-five', name: 'Find five steady things', short: 'Let the room tell your nervous system where you are.', steps: [
    { time: 20, title: 'Let your eyes land', body: 'Without searching, notice one shape that feels steady. Let your gaze rest there.' },
    { time: 35, title: 'Find four more', body: 'Name four ordinary things you can see. Color and shape are enough.' },
    { time: 35, title: 'Add one point of contact', body: 'Notice where the chair or floor is holding your weight. You do not need to change anything.' },
  ], bridge: 'I am overloaded and could use a calm person nearby for a few minutes. You do not need to fix it.', why: 'External orientation can reduce the load of fast internal thoughts without asking you to analyze them.', cautions: [] },
  { id: 'pressure-anchor', name: 'Add a point of pressure', short: 'Use safe, steady pressure as an anchor.', steps: [
    { time: 15, title: 'Choose a neutral place', body: 'Place one palm against the other, or press both feet gently into the floor.' },
    { time: 30, title: 'Hold, do not strain', body: 'Use about one-third of your strength. Notice pressure, temperature, and the edge of contact.' },
    { time: 15, title: 'Release slowly', body: 'Reduce the pressure in three small stages. Keep your eyes on one steady object.' },
  ], bridge: 'I feel disconnected from my body right now. Can you stay with me while I get oriented?', why: 'Proprioceptive input can offer a concrete body signal when everything feels distant or unreal.', cautions: ['Stop if pressure causes pain or numbness.'] },
  { id: 'longer-out', name: 'Make the out-breath easier', short: 'No counting perfectly. No giant breaths.', steps: [
    { time: 15, title: 'Keep the inhale ordinary', body: 'Breathe in normally. A small breath is enough.' },
    { time: 45, title: 'Soften the exhale', body: 'Let the air out a little more slowly than it came in. Repeat only if it feels comfortable.' },
    { time: 15, title: 'Return to normal', body: 'Drop the exercise and notice one sound in the room.' },
  ], bridge: 'My body is in alarm mode. Could you talk to me slowly about something ordinary?', why: 'A comfortable, slightly longer exhale may support down-regulation without forcing deep breathing.', cautions: ['Skip this if breath focus feels uncomfortable, dizzying, or activating.'] },
  { id: 'micro-movement', name: 'Give the energy an exit', short: 'A tiny movement for a body that wants to run.', steps: [
    { time: 30, title: 'Push and release', body: 'Press your heels down for three seconds, then let go. Keep the effort comfortable.' },
    { time: 30, title: 'Cross the midline', body: 'Tap your right hand to your left knee, then switch, at any pace that feels manageable.' },
    { time: 30, title: 'Make it smaller', body: 'Slow the movement until it is almost still. Notice what changed, even by one percent.' },
  ], bridge: 'I have a lot of restless energy and need a short walk or quiet company. Can you join me?', why: 'Structured movement can give high activation a bounded outlet before asking for stillness.', cautions: ['Use a seated version if balance, pain, or dizziness is a concern.'] },
  { id: 'reduce-input', name: 'Turn the volume down', short: 'Remove one source of demand instead of adding a task.', steps: [
    { time: 15, title: 'Choose one input', body: 'Dim one screen, mute one sound, or move one visually busy object out of view.' },
    { time: 15, title: 'Lower one demand', body: 'Silence notifications for ten minutes or place the current task face-down.' },
    { time: 15, title: 'Keep the pause', body: 'Do nothing new. Let the reduced input be the intervention.' },
  ], bridge: 'I am overstimulated. Could we use fewer words and lower the noise for a little while?', why: 'When input load is the problem, subtraction is often safer and easier than another coping task.', cautions: [] },
  { id: 'one-true-sentence', name: 'Use one true sentence', short: 'Name the moment without solving your whole life.', steps: [
    { time: 20, title: 'Shrink the timeframe', body: 'Begin with: “Right now, I notice…” Avoid explaining why.' },
    { time: 20, title: 'Name one need', body: 'Add: “For the next ten minutes, I need…” Small and practical counts.' },
    { time: 20, title: 'Stop there', body: 'Read the two sentences once. They do not need to become a plan.' },
  ], bridge: 'Right now I am having a hard time finding words. I need low-pressure company, not solutions.', why: 'Brief affect labeling can create distance from a feeling while keeping cognitive demand low.', cautions: ['Skip reflection if naming feelings makes the moment more intense.'] },
  { id: 'warm-cool', name: 'Notice a safe temperature', short: 'Use gentle temperature contrast to return to the present.', steps: [
    { time: 20, title: 'Choose mild, not extreme', body: 'Hold a cool glass, warm mug, or room-temperature object. Avoid ice directly on skin.' },
    { time: 35, title: 'Locate the boundary', body: 'Notice exactly where the temperature starts and ends against your hand.' },
    { time: 20, title: 'Name the change', body: 'Use one word: warmer, cooler, same, or unsure.' },
  ], bridge: 'I feel far away right now. Can you help me stay connected to the room?', why: 'A mild, concrete sensation can support present-moment orientation with very little language.', cautions: ['Avoid extreme temperatures or numb, injured, or sensitive skin.'] },
  { id: 'borrow-a-nervous-system', name: 'Borrow a calm nervous system', short: 'Connection can be the intervention.', steps: [
    { time: 20, title: 'Pick the safest person', body: 'Choose someone who can be calm and does not need a full explanation.' },
    { time: 30, title: 'Send the bridge', body: 'Use the message below as-is, or change only one phrase.' },
    { time: 70, title: 'Reduce the ask', body: 'Request ten quiet minutes, a short call, or simple company. You are not asking them to solve it.' },
  ], bridge: 'I am having a hard moment. Could you stay with me for ten minutes? I do not need advice—just a steady person.', why: 'Safe social contact can reduce isolation when self-guided techniques ask too much.', cautions: ['Choose emergency or crisis support instead if you may not be able to stay safe.'] },
];
const byId = new Map(content.map((practice) => [practice.id, practice]));
export const practices: Practice[] = MODEL_SPEC.map((spec) => ({ ...spec, ...(byId.get(spec.id) as PracticeContent) }));
export const practiceById = new Map(practices.map((practice) => [practice.id, practice]));

export const signalOptions: { id: SignalId; label: string }[] = [
  { id: 'racing', label: 'Thoughts racing' }, { id: 'tight-chest', label: 'Chest feels tight' },
  { id: 'overstimulated', label: 'Everything is too much' }, { id: 'unreal', label: 'Things feel unreal' },
  { id: 'restless', label: 'Need to move' }, { id: 'shutdown', label: 'Shut down or frozen' },
  { id: 'sad', label: 'Heavy or low' }, { id: 'shame', label: 'Want to disappear' },
  { id: 'irritable', label: 'On edge' }, { id: 'numb', label: 'Numb or far away' },
];
export const needOptions: { id: NeedId; label: string }[] = [
  { id: 'grounding', label: 'Feel more here' }, { id: 'quiet', label: 'Less input' },
  { id: 'release', label: 'Let energy out' }, { id: 'connection', label: 'Reach someone' },
  { id: 'clarity', label: 'Untangle one thought' }, { id: 'settle', label: 'Settle my body' },
];

export interface EvidenceEntry { id: string; intendedUse: string; evidenceFamily: string; evidenceLevel: string; summary: string; caution: string; contraindication: string; sources: { label: string; url: string }[]; reviewStatus: string; reviewedAt: string; }
const reviewed = { reviewStatus: 'Literature-informed; not clinician reviewed', reviewedAt: '2026-08-08' };
export const evidenceLedger: EvidenceEntry[] = [
  { id: 'orient-five', intendedUse: 'Briefly orient attention toward ordinary features of the present environment.', evidenceFamily: 'Sensory grounding', evidenceLevel: 'Practice rationale', summary: 'VA guidance describes visual, auditory, and tactile questions as grounding options that may help attention return to current circumstances.', caution: 'Stop if environmental scanning increases distress, frustration, or vigilance.', contraindication: 'The practice asks the user to stop if it feels worse.', sources: [{ label: 'VA National Center for PTSD — grounding', url: 'https://www.ptsd.va.gov/professional/treat/care/toolkits/police/managingStrategies.asp' }], ...reviewed },
  { id: 'pressure-anchor', intendedUse: 'Offer a neutral tactile and proprioceptive point of attention without demanding emotional language.', evidenceFamily: 'Tactile grounding', evidenceLevel: 'Practice rationale', summary: 'VA grounding guidance includes present-moment attention across touch and other sensory modalities; this exact sequence has not been clinically evaluated by Unspool.', caution: 'Use light pressure and stop for pain, numbness, or discomfort.', contraindication: 'Avoid pressure on injured, painful, or numb areas.', sources: [{ label: 'VA National Center for PTSD — grounding', url: 'https://www.ptsd.va.gov/professional/treat/care/toolkits/police/managingStrategies.asp' }], ...reviewed },
  { id: 'longer-out', intendedUse: 'Offer optional, comfortable breath pacing for a brief relaxation attempt.', evidenceFamily: 'Paced breathing', evidenceLevel: 'Research-informed', summary: 'NCCIH includes breathing exercises among relaxation techniques while noting limited evidence for specific conditions.', caution: 'Breath attention can increase distress; the practice is excluded whenever “skip breath-focused steps” is selected.', contraindication: 'Stop for dizziness, discomfort, breathlessness, or activation.', sources: [{ label: 'NCCIH — relaxation techniques', url: 'https://www.nccih.nih.gov/health/relaxation-techniques-what-you-need-to-know' }], ...reviewed },
  { id: 'micro-movement', intendedUse: 'Provide a small, bounded movement option when stillness is not accessible.', evidenceFamily: 'Gentle movement', evidenceLevel: 'Practice rationale', summary: 'VA coping guidance includes stretching, exercise, and movement among active coping options. This exact sequence has no claimed treatment effect.', caution: 'Use the seated version if balance, pain, fatigue, or dizziness is a concern.', contraindication: 'Stop for pain, instability, or worsening symptoms.', sources: [{ label: 'VA — coping with stress reactions', url: 'https://www.ptsd.va.gov/gethelp/coping_stress_reactions.asp' }], ...reviewed },
  { id: 'reduce-input', intendedUse: 'Reduce one avoidable source of sensory or task demand.', evidenceFamily: 'Stimulus reduction', evidenceLevel: 'Practice rationale', summary: 'WHO stress guidance recommends limiting distress-increasing media exposure; Unspool applies that subtraction principle to one reversible input.', caution: 'Do not silence alarms, accessibility aids, safety notifications, or necessary communication.', contraindication: 'Only remove inputs that are optional and safe to pause.', sources: [{ label: 'WHO — stress', url: 'https://www.who.int/news-room/questions-and-answers/item/stress/' }], ...reviewed },
  { id: 'one-true-sentence', intendedUse: 'Briefly label the current moment and one small need without requiring a narrative.', evidenceFamily: 'Affect labeling', evidenceLevel: 'Research-informed', summary: 'A laboratory study associated affect labeling with reduced limbic response to negative images. That does not establish efficacy for this exact practice.', caution: 'Reflection is automatically excluded at intensity 8–10.', contraindication: 'Not selected for high-intensity check-ins.', sources: [{ label: 'Lieberman et al. (2007) — PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/17576282/' }], ...reviewed },
  { id: 'warm-cool', intendedUse: 'Use a mild, safe tactile sensation as a present-moment reference.', evidenceFamily: 'Sensory orientation', evidenceLevel: 'Practice rationale', summary: 'VA grounding guidance includes attention to touch and immediate sensory information. Unspool restricts this to mild temperature.', caution: 'Avoid extreme temperatures and prolonged contact.', contraindication: 'Do not use on injured, numb, or temperature-sensitive skin.', sources: [{ label: 'VA National Center for PTSD — grounding', url: 'https://www.ptsd.va.gov/professional/treat/care/toolkits/police/managingStrategies.asp' }], ...reviewed },
  { id: 'borrow-a-nervous-system', intendedUse: 'Lower the language burden of asking a trusted person for brief, low-pressure company.', evidenceFamily: 'Social support', evidenceLevel: 'Research-informed', summary: 'CDC and WHO guidance encourage connecting with trusted people during stress. Availability, safety, and individual responses vary.', caution: 'Choose a person who is safe and does not require a detailed explanation.', contraindication: 'Use crisis or emergency support instead when immediate safety is uncertain.', sources: [{ label: 'CDC — managing stress', url: 'https://www.cdc.gov/mental-health/living-with/index.html' }, { label: 'WHO — stress', url: 'https://www.who.int/news-room/questions-and-answers/item/stress/' }], ...reviewed },
];
