// PivotKit — Mentor Voice Content Library
// All blurbs locked and approved. Do not edit without re-running the voice review process.

export type ContentType =
  | 'mentor_voice'
  | 'subtitle'
  | 'tooltip'
  | 'field_label'
  | 'warning'
  | 'explainer'
  | 'tip'
  | 'callout'
  | 'lock_callout'
  | 'stage_intro'
  | 'reminder'
  | 'decision_prompt'
  | 'mentor_voice_flag';

export interface ContentItem {
  id: string;
  type: ContentType;
  location: string;
  text: string;
}

export const CONTENT: Record<string, ContentItem> = {

  // ─────────────────────────────────────────────
  // WELCOME SCREEN — Shown before Part 0 on new projects
  // ─────────────────────────────────────────────

  welcome_headline: {
    id: "welcome_headline",
    type: "mentor_voice",
    location: "Welcome screen — main headline",
    text: `Welcome to PivotKit`,
  },

  welcome_intro: {
    id: "welcome_intro",
    type: "explainer",
    location: "Welcome screen — introductory paragraph",
    text: `This tool is designed to do one thing: help you figure out if your idea is worth pursuing — before you waste months building the wrong thing.\n\nMost startup teams skip the hard part. They jump straight to building a solution without proving anyone actually has the problem. PivotKit won't let you do that.`,
  },

  welcome_mentor_bio: {
    id: "welcome_mentor_bio",
    type: "mentor_voice",
    location: "Welcome screen — mentor bio, shown after intro",
    text: `The guidance you'll see throughout PivotKit comes from Monty Sharma — serial entrepreneur and startup mentor with 15+ years advising over 600 startups, from first-time founders to deep-tech teams. Every tip, warning, and nudge in this tool is drawn from real patterns he's seen working with early-stage companies. The same mistakes. The same breakthroughs. The same moments where one honest conversation changed everything. Think of the lightbulb tips as Monty sitting across the table from you, telling you what he'd tell any team he's working with.`,
  },

  welcome_process: {
    id: "welcome_process",
    type: "explainer",
    location: "Welcome screen — process overview",
    text: `Here's how it works. You'll move through three phases, and each one has to be earned:`,
  },

  welcome_step0_desc: {
    id: "welcome_step0_desc",
    type: "explainer",
    location: "Welcome screen — Step 0 description",
    text: `Write down your idea, identify who might have this problem, and pick the smallest, most desperate group to start with. This takes 15–20 minutes.`,
  },

  welcome_quickcheck_desc: {
    id: "welcome_quickcheck_desc",
    type: "explainer",
    location: "Welcome screen — Quick Check description",
    text: `Before you talk to anyone, articulate exactly what you're testing. What's the problem? Who has it? What's your hypothesis? This forces clarity before you spend time on interviews.`,
  },

  welcome_discovery_desc: {
    id: "welcome_discovery_desc",
    type: "explainer",
    location: "Welcome screen — Discovery description",
    text: `Now the real work. Go talk to people. Log what you learn. The tool tracks your assumptions and won't let you call something "validated" until you've actually done the work. Five real conversations minimum, not five confirmations from friends.`,
  },

  welcome_cta: {
    id: "welcome_cta",
    type: "mentor_voice",
    location: "Welcome screen — call to action",
    text: `Ready? Let's find out if this idea is a winner or a loser. Either answer is good — the only bad outcome is not knowing.`,
  },

  // ─────────────────────────────────────────────
  // STEP 0 · PART 0 — Idea Statement + Framing
  // ─────────────────────────────────────────────

  step0_p0_opening_orientation: {
    id: "step0_p0_opening_orientation",
    type: "mentor_voice",
    location: "Step 0 · Part 0 — shown above everything else, first thing user reads",
    text: `The best news you can get is that your company is a big hit and you're going to be rich. The second best is a quick 'this won't work.' Between those two is years of slogging and doubting while you figure things out.\n\nThe goal of this whole process is to push the middle out to the ends. Find the winners fast. Drop the losers before they cost you everything. That's it. That's what we're doing here.`,
  },

  step0_p0_page_subtitle: {
    id: "step0_p0_page_subtitle",
    type: "subtitle",
    location: "Step 0 · Part 0 — page subtitle below 'Your First Look' header",
    text: `Most teams come in here and tell me about their solution. I don't care about your solution yet. Neither should you. Right now the only question that matters is: does anyone actually have this problem, and do they care enough to do something about it?`,
  },

  step0_p0_idea_statement_tooltip: {
    id: "step0_p0_idea_statement_tooltip",
    type: "tooltip",
    location: "Step 0 · Part 0 — tooltip on the idea statement input field",
    text: `Plain language. No pitch. If you need fancy words to explain it, you don't understand it yet. Who are you building this for and what problem does it solve — that's all this needs to be right now.`,
  },

  step0_p0_mangos: {
    id: "step0_p0_mangos",
    type: "mentor_voice",
    location: "Step 0 · Part 0 — shown on first load as a mentor voice callout",
    text: `Ideas are mangos, not children. When you're picking a mango at the store, you don't just grab the first one you see. You pick it up, feel how heavy it is, press it a little to see if it's ripe, smell it. You're looking for signals before you commit. That's what this whole process is — you're feeling the mango. Don't fall in love with it before you know if it's any good. But you have to love your kids.`,
  },

  step0_p0_why_now_label: {
    id: "step0_p0_why_now_label",
    type: "field_label",
    location: "Step 0 · Part 0 — label for the Why Now? input field",
    text: `What's changed recently that makes this problem solvable today?`,
  },

  step0_p0_why_now_tooltip: {
    id: "step0_p0_why_now_tooltip",
    type: "tooltip",
    location: "Step 0 · Part 0 — tooltip on the Why Now? field",
    text: `Something changed. It always does. YouTube couldn't exist without broadband. Uber needed a smartphone in everyone's pocket. Whatever you're building — something shifted recently that makes this possible now. There are a lot of experts and smart people in the world — why are you the only one who noticed? If you can't put your finger on what that is, you don't understand your own timing yet. That's a problem. Figure it out before you move on.`,
  },

  step0_p0_fmf_label: {
    id: "step0_p0_fmf_label",
    type: "field_label",
    location: "Step 0 · Part 0 — label for Founder-Market Fit section",
    text: `Why are you the right person to solve this?`,
  },

  step0_p0_fmf_tooltip: {
    id: "step0_p0_fmf_tooltip",
    type: "tooltip",
    location: "Step 0 · Part 0 — tooltip on Founder-Market Fit section",
    text: `Every investor I know asks this first. Not 'is this a good idea' — 'why you?' I've watched brilliant ideas go nowhere because the founder had no real connection to the customer. And I've watched mediocre ideas turn into real businesses because the founder knew the customer and found the path to a big idea. Do you have direct experience with this problem? Do you know these people? Can you pick up the phone and talk to ten of them today? If the answer to all three is no, that's not a dealbreaker — but you know what you need to do.`,
  },

  step0_p0_fmf_warning: {
    id: "step0_p0_fmf_warning",
    type: "warning",
    location: "Step 0 · Part 0 — shown when FMF score is low",
    text: `You don't know these people and you haven't lived this problem. That's not disqualifying — some of the best founders figured it out from scratch. But you need to know that going in. You're not validating a hypothesis right now, you're buying a clue. Go find five people who are neck-deep in this problem and don't talk about your idea, ask them about their problems. If they don't surprise you, you are missing something.`,
  },

  // ─────────────────────────────────────────────
  // STEP 0 · PART 1 — Customers & Their Problems
  // ─────────────────────────────────────────────

  step0_p1_explainer: {
    id: "step0_p1_explainer",
    type: "explainer",
    location: "Step 0 · Part 1 — top of screen, above customer segment input",
    text: `Here's what I see every single time. Team comes in, tells me about their solution, and when I ask who has this problem they describe someone who conveniently needs exactly what they built. Or a persona they heard about in marketing. That's not a customer. That's a wish. Start here. Who is already suffering from this problem right now, today, before you showed up? When you have talked to a bunch you can then come up with a general description.`,
  },

  step0_p1_desperate_segment: {
    id: "step0_p1_desperate_segment",
    type: "tip",
    location: "Step 0 · Part 1 — shown below the segment list",
    text: `Not all customers are equal. Some people have this problem and live with it. Some people have it and it's costing them real money or real pain every single day. Those are the ones you want. Who's already trying to fix this on their own — with a spreadsheet, a workaround, or just white-knuckling through it? Those are your people. Start there.`,
  },

  // ─────────────────────────────────────────────
  // STEP 0 · PART 2 — Segment Ranking & Beachhead
  // ─────────────────────────────────────────────

  step0_p2_beachhead_tip: {
    id: "step0_p2_beachhead_tip",
    type: "tip",
    location: "Step 0 · Part 2 — replaces current beachhead tip",
    text: `Don't pick the biggest group. Pick the most desperate one. I've seen a hundred teams go after everyone and reach no one. Find the smallest group of people where this problem is so bad they're already trying to fix it themselves — badly. That's your starting point. You can always expand. You can't fix a foundation once you've built on the wrong one.`,
  },

  step0_p2_tam_callout: {
    id: "step0_p2_tam_callout",
    type: "callout",
    location: "Step 0 · Part 2 — callout box below the segment scoring table",
    text: `Every deck I've ever seen has the same slide. A billion people have this problem. A hundred million live near me. I'm going after 5% and that makes me rich. Nobody who knows what they are doing believes this — it's a red flag.\n\nHere's what actually impresses me. Show me the 100 people who are in the most pain and need exactly what you're building right now. Tell me you've talked to them. Then show me the feature that gets you to the next 500, and the one after that that opens up 5,000 more. Build it from the ground up.\n\nThat tells me you know your customer. The other slide tells me you know how to use Google.`,
  },

  step0_p2_scoring_tooltip: {
    id: "step0_p2_scoring_tooltip",
    type: "tooltip",
    location: "Step 0 · Part 2 — tooltip on the Pain / Access / Willingness rating inputs",
    text: `Pain: are they losing sleep over this or just mildly annoyed? Access: can you get in front of them this week, or do you need six months of introductions? Willingness to pay: have they already tried to solve this with money, or are they hoping someone does it for free? Rate honestly, take your first cut then argue against yourself. Tell yourself why that analysis is flawed, in both estimates you made assumptions the real work is proving one side or the other. Inflating these numbers only hurts you.`,
  },

  // ─────────────────────────────────────────────
  // STEP 0 · PART 3 — Assumptions
  // ─────────────────────────────────────────────

  step0_p3_assumptions_intro: {
    id: "step0_p3_assumptions_intro",
    type: "explainer",
    location: "Step 0 · Part 3 — top of assumptions screen",
    text: `Everything you just wrote down is something you believe to be true. None of it is proven. That's fine — that's where everyone starts. Now we're going to write it down as assumptions so you know exactly what you're betting on. The ones that are most likely wrong and matter the most — those are the ones you test first.`,
  },

  step0_p3_customer_identity_tooltip: {
    id: "step0_p3_customer_identity_tooltip",
    type: "tooltip",
    location: "Step 0 · Part 3 — tooltip on auto-generated customer identity assumption",
    text: `Before you test your solution, you have to prove the customer exists. Not 'someone like this probably exists.' You need to have talked to them. This assumption — that this specific group of people has this problem — is the one that kills most ideas when it's wrong. Is this a real problem? Are they willing to do anything about it?`,
  },

  step0_p3_solution_lock: {
    id: "step0_p3_solution_lock",
    type: "lock_callout",
    location: "Step 0 · Part 3 — shown when user tries to add solution assumptions before Stage 1",
    text: `I know you want to get to the solution. Everyone does. But I've watched teams spend six months building the wrong thing for the wrong people because they skipped this part. Ok, I have done it myself. You don't get to test your solution until you've proven the problem is real and you know exactly who has it. That's not a rule I made up — that's the pattern from every team I've watched fail. Finish Stage 1 first.`,
  },

  // ─────────────────────────────────────────────
  // STEP 0 · PART 4 — Summary & Graduate
  // ─────────────────────────────────────────────

  step0_p4_summary: {
    id: "step0_p4_summary",
    type: "mentor_voice",
    location: "Step 0 · Part 4 — summary screen before Graduate CTA",
    text: `You've done the first pass. Here's what you think you know. Now here's the hard part — most of what's on this list is wrong. Not because you're not smart, but because you haven't talked to enough people yet. These are the assumptions that matter most. Go test them. Come back when you have data, not opinions.`,
  },

  // ─────────────────────────────────────────────
  // DISCOVERY — Stage Intros
  // ─────────────────────────────────────────────

  discovery_stage1_intro: {
    id: "discovery_stage1_intro",
    type: "stage_intro",
    location: "Discovery — Stage 1 header / intro text",
    text: `You've done your first look. Now the real work starts. Stage 1 has one job — prove that a real group of people has a real problem that's worth solving. Not a survey. Not a Google search. Actual conversations. Until you can say 'I talked to X people and here's what I found,' you're still guessing. Your need to find the nuance, these people have this problem but it is not a big deal, a different segment the problem is real. Nothing is for everyone.`,
  },

  discovery_stage2_intro: {
    id: "discovery_stage2_intro",
    type: "stage_intro",
    location: "Discovery — Stage 2 header / intro text",
    text: `You've proven the problem is real. Now you get to talk about your solution — but you're still not building yet. You're testing whether your approach actually solves what you found. Words and pictures first. Show people how it would work and watch their reaction. Not what they say — what they do. Do they lean in or do they nod politely and change the subject?\n\nYou're looking for the smallest solution they would be willing to accept. That's your starting point. Once you know that, you'll see the natural order of what to build next — which features unlock which customer segments, and in what sequence. That's not a roadmap you make up. That's one your customers hand you.`,
  },

  discovery_stage3_intro: {
    id: "discovery_stage3_intro",
    type: "stage_intro",
    location: "Discovery — Stage 3 header / intro text",
    text: `You've proven the problem is real and people want your solution. Now the question is whether you can build a business around it. Can you reach these customers without spending more than they're worth? Does the math work at scale? I've seen great products fail here because nobody asked these questions early enough. The economics have to work in the current economy — not in some future version where everything goes right.`,
  },

  // ─────────────────────────────────────────────
  // DISCOVERY — Stage Gates
  // ─────────────────────────────────────────────

  stage2_lock_callout: {
    id: "stage2_lock_callout",
    type: "lock_callout",
    location: "Discovery — shown when Stage 2 is locked",
    text: `You can't test your solution if you don't know who you're solving it for. Stage 2 is locked until you've validated the customer and the problem. I know it feels like you're ready. You're not. You want to know how big the pain is and why it exists — if you know that, you can build a solution.`,
  },

  stage3_lock_callout: {
    id: "stage3_lock_callout",
    type: "lock_callout",
    location: "Discovery — shown when Stage 3 is locked",
    text: `You don't get to talk about revenue until you know someone actually wants what you're building. I've sat through a hundred pitches where the business model slide was beautiful and the product had never been in front of a real customer. Stage 3 is locked. Go back and find out if your solution actually solves the problem you validated in Stage 1.\n\nAnd you don't need to build it to find out. Words and pictures are enough at this stage. Show someone how it would work. If your idea is great, customers will tell you — and the best ones will want to help fund it.`,
  },

  // ─────────────────────────────────────────────
  // DISCOVERY — Assumption Tooltips
  // ─────────────────────────────────────────────

  assumption_existing_alternatives_tooltip: {
    id: "assumption_existing_alternatives_tooltip",
    type: "tooltip",
    location: "Discovery — tooltip on the Existing Alternatives assumption",
    text: `This is one of the most important questions you can ask. What do they do today? Not what do they wish they had — what do they actually do right now? A spreadsheet, a workaround, nothing, hiring someone, ignoring it. That's your real competition. Not the other startups in your space — it's the behavior you're trying to replace. If you don't know the answer, you haven't done enough interviews.`,
  },

  assumption_solution_tooltip: {
    id: "assumption_solution_tooltip",
    type: "tooltip",
    location: "Discovery — tooltip on the Solution assumption",
    text: `You've validated the problem. Now you're testing whether your approach actually solves it. Don't describe what you want to build — describe what the customer gets. What does their life look like after they use this? How is that different from what they do today? If you can't answer that in two sentences, you're not ready to build anything yet.`,
  },

  assumption_uvp_tooltip: {
    id: "assumption_uvp_tooltip",
    type: "tooltip",
    location: "Discovery — tooltip on the Unique Value Proposition assumption",
    text: `Different isn't enough. Better isn't enough either if nobody can feel the difference. What does your solution do that makes someone say 'finally'? That's what you're looking for. Not a feature list — the one thing that makes someone stop using what they use today and switch to you.\n\nAnd remember — people hate change. How many simple things about your own life could you change right now but don't? Your customers are the same way. The bar isn't 'this is better.' The bar is 'this is so much better that it's worth the hassle of changing.' If you can't clear that bar, go back to your interviews and ask people what would actually make them switch.`,
  },

  assumption_revenue_tooltip: {
    id: "assumption_revenue_tooltip",
    type: "tooltip",
    location: "Discovery — tooltip on the Revenue Streams assumption",
    text: `Willingness to pay is not the same as actually paying. I've watched teams get twenty people to say 'oh yeah I'd pay for that' and then get zero customers when they launched. Put a price in front of them. Watch what happens. That's the only data that matters here.\n\nOne of the best things you can do at this stage is ask a potential customer for a nonbinding letter of intent. Nothing fancy — just something that says 'this looks good and if it does what you say it does, I might buy it.' Most people will sign one if they mean it. Most people won't if they don't. You'll find out fast who's real.`,
  },

  assumption_channels_tooltip: {
    id: "assumption_channels_tooltip",
    type: "tooltip",
    location: "Discovery — tooltip on the Channels assumption",
    text: `How are you going to find these people and how much is it going to cost you to get their attention? Every startup thinks this part is easy until they try it. Your channel has to reach the right people without costing more than they're worth. If your only answer is social media and word of mouth, you don't have a channel — you have a hope. Go talk to people who sell to this segment and find out how they actually reach them.`,
  },

  assumption_costs_tooltip: {
    id: "assumption_costs_tooltip",
    type: "tooltip",
    location: "Discovery — tooltip on the Cost Structure assumption",
    text: `Do the math before you fall in love with the business. What does it actually cost you to acquire a customer, deliver the product, and keep them? If you don't know those numbers yet, make your best guess and write down what you're assuming. The goal right now isn't precision — it's finding out if there's a fundamental problem with the economics before you build the whole thing.`,
  },

  assumption_metrics_tooltip: {
    id: "assumption_metrics_tooltip",
    type: "tooltip",
    location: "Discovery — tooltip on the Key Metrics assumption",
    text: `It's easy to measure a ton of things. That's not the goal. What you're trying to figure out is the fewest number of metrics you need to understand what's actually going on. Start with one. Then ask yourself — what does this number tell me? And just as importantly, what does it not tell me? That second question is where you add the next metric. Keep going until you can see the whole picture with as little noise as possible.`,
  },

  assumption_unfair_advantage_tooltip: {
    id: "assumption_unfair_advantage_tooltip",
    type: "tooltip",
    location: "Discovery — tooltip on the Unfair Advantage assumption",
    text: `What do you have that someone with money can't just go out and buy? A patent isn't it — on its own a patent is a legal bill and a prayer. I'm talking about the thing that gives you a head start that compounds over time. Deep relationships with the customer. Data nobody else has. A distribution channel it took years to build. If you don't have one yet, that's okay — but you better know what it's going to be and how you're going to build it.`,
  },

  // ─────────────────────────────────────────────
  // DISCOVERY — Confidence & Pivot Resistance
  // ─────────────────────────────────────────────

  assumption_confidence_tooltip: {
    id: "assumption_confidence_tooltip",
    type: "tooltip",
    location: "Discovery — tooltip on the confidence score input",
    text: `This number should move — and not just up. Every conversation you have should be sharpening your picture of the real problem. You're not collecting confirmations, you're digging. Think of it this way: you walk in thinking grandpa moves slow and needs an energy drink. You keep asking why, you keep digging, and you find out he walks hunched over because of a slipped disk. That's a completely different problem with a completely different solution. That's what you're trying to do here — get from the surface symptom to the real thing. If your confidence only ever goes up, you stopped digging too soon.`,
  },

  assumption_confidence_never_drops: {
    id: "assumption_confidence_never_drops",
    type: "mentor_voice_flag",
    location: "Discovery — shown when all confidence scores have only increased",
    text: `Every single assumption getting more confident over time. That's a red flag, not a good sign. Either you're only talking to people who agree with you, or you're hearing what you want to hear. Both will kill you later. Go find the person who thinks this is a terrible idea and buy them a coffee. Listen to everything they say.`,
  },

  assumption_pivot_resistance: {
    id: "assumption_pivot_resistance",
    type: "mentor_voice_flag",
    location: "Discovery — shown when 3+ interviews contradict but confidence hasn't moved",
    text: `Your confidence score hasn't moved but your interviews are pushing back. Here's what I want you to do — stop defending the assumption and start drilling into what they're actually telling you.\n\nRemember, you're not trying to prove you were right. You're trying to find what's real. As you dig into the problem you start to get a better sense of the whole area around it. There may be a completely different problem than the one you thought you were solving — one that actually does need a solution and that people will pay for.\n\nWhat are your customers pointing to? Follow that.`,
  },

  // ─────────────────────────────────────────────
  // DISCOVERY — Interviews
  // ─────────────────────────────────────────────

  interview_setup_guidance: {
    id: "interview_setup_guidance",
    type: "mentor_voice",
    location: "Discovery — shown above the interview form before first interview",
    text: `Before you sit down with anyone, get this straight — you are not pitching. You are not explaining your idea. You are not looking for validation. You are looking for surprise. If every person you talk to confirms exactly what you already believed, you are asking the wrong questions or talking to the wrong people. Go in with your assumptions written down. Come out knowing which ones are wrong.`,
  },

  interview_not_pitching: {
    id: "interview_not_pitching",
    type: "reminder",
    location: "Discovery — shown above the interview entry form on every interview",
    text: `You are not here to pitch. The second you start explaining your idea, the interview is over — you've just turned a customer conversation into a sales call and everything they say after that is contaminated.\n\nHere's the other trap. People are nice. They don't want to tell you your idea is bad. So they'll find ways to kind of agree with you — but not really. They'll say things like 'oh that's interesting' or 'yeah I could see that being useful.' That's not a yes. That's a polite no. You have to learn to hear the difference.\n\nAsk about their life. Ask about their problem. Ask what they do about it today. Shut up and listen.`,
  },

  interview_big3_framework: {
    id: "interview_big3_framework",
    type: "tip",
    location: "Discovery — tooltip or guidance panel on interview question framework",
    text: `Three questions matter. What's the problem? What do you do about it today? What does it cost you — time, money, stress — when it doesn't get solved? Then ask why. Not once. Keep asking why until you hit something real. The first answer is almost never the real answer. People tell you what they think you want to hear. The why is where the truth lives.`,
  },

  interview_minimum_threshold_warning: {
    id: "interview_minimum_threshold_warning",
    type: "warning",
    location: "Discovery — shown at 3 interviews (2 short of minimum)",
    text: `Three interviews is a conversation, not a pattern. You need at least five before you start drawing conclusions — and five only works if they're five different people who don't all know each other. Don't just talk to who you think the customer is. Talk to people around them — their colleagues, their manager, the person who has to deal with the downstream effects of their problem. You'll get a much better sense of where the problem actually sits. One more thing: if all three so far said the same thing, that should make you more suspicious, not more confident. Go find someone who pushes back.`,
  },

  interview_segment_warning: {
    id: "interview_segment_warning",
    type: "warning",
    location: "Discovery — shown when user logs interview outside focused segment",
    text: `This person isn't in your target segment. That's not automatically wrong — talking to people around your customer can tell you a lot. But if you're doing this because it's easier to get these interviews, stop. Easy interviews don't give you real data. They give you comfort. Go get the hard ones.`,
  },

  // ─────────────────────────────────────────────
  // DISCOVERY — Pivot / Patch / Proceed
  // ─────────────────────────────────────────────

  pivot_prompt: {
    id: "pivot_prompt",
    type: "decision_prompt",
    location: "Discovery — pivot/patch/proceed decision screen",
    text: `What do you know about these customers now that you didn't know when you started? Is there something they kept pointing to that you didn't even think of as a problem? What can you do to make their life better — and is there money in that?\n\nWe don't start companies to prove we were right. We start them to make money. If the interviews are telling you something different from what you walked in believing, that's not failure — that's the best thing that could have happened to you. Follow the problem, not your original idea.`,
  },

  proceed_with_red_assumptions: {
    id: "proceed_with_red_assumptions",
    type: "warning",
    location: "Discovery — shown when user selects Proceed with 2+ red assumptions",
    text: `You've got assumptions marked red and you want to move forward. I've seen this before too. Just be honest with yourself about what you're doing — you're making a bet that these things will work out. Sometimes that's right. Usually it isn't. What would it take to find out if these assumptions are wrong? If the answer is two more conversations, go have them. You don't get those two conversations back once you've built the thing.`,
  },

  // ─────────────────────────────────────────────
  // MENTOR DASHBOARD
  // ─────────────────────────────────────────────

  mentor_quality_score_explainer: {
    id: "mentor_quality_score_explainer",
    type: "explainer",
    location: "Mentor Dashboard — Discovery Quality Score explanation",
    text: `This score tells you whether you're actually doing discovery or just going through the motions. I've seen teams log five interviews with their roommates and call it validated. Look at who you talked to. Did your confidence scores ever go down? How fast did you move through Stage 1? Fast is not good — if you blew through it in a week, you skipped something. Click in and look honestly at what your interviews actually told you.`,
  },

};

// ─────────────────────────────────────────────
// LOOKUP HELPERS
// ─────────────────────────────────────────────

export const getContent = (id: string): string => CONTENT[id]?.text ?? "";

export const getContentItem = (id: string): ContentItem | undefined => CONTENT[id];

export const getContentByType = (type: ContentType): ContentItem[] =>
  Object.values(CONTENT).filter((item) => item.type === type);

// Canvas area to tooltip ID mapping
export const CANVAS_AREA_TOOLTIPS: Record<string, string> = {
  existingAlternatives: 'assumption_existing_alternatives_tooltip',
  solution: 'assumption_solution_tooltip',
  uniqueValueProposition: 'assumption_uvp_tooltip',
  revenueStreams: 'assumption_revenue_tooltip',
  channels: 'assumption_channels_tooltip',
  costStructure: 'assumption_costs_tooltip',
  keyMetrics: 'assumption_metrics_tooltip',
  unfairAdvantage: 'assumption_unfair_advantage_tooltip',
};
