/* ═══════════════════════════════════════════════════════════
   Paper Sunsets — story data
   All dialogue and branching lives here. The engine reads this.
   ═══════════════════════════════════════════════════════════ */

window.STORY = {
  meta: {
    title: "Paper Sunsets",
    subtitle: "A story about the things we write instead of saying.",
    version: "1.1.0"
  },

  endings: [
    {
      id: "sunset",
      number: 1,
      title: "Meet Me at Sunset",
      blurb: "You said her name. The roof stopped being empty."
    },
    {
      id: "letters",
      number: 2,
      title: "Keep Writing",
      blurb: "You didn't know who she was, but you asked anyway. Some answers arrive in envelopes."
    },
    {
      id: "wrong",
      number: 3,
      title: "The Wrong Name",
      blurb: "You guessed wrong, and the sunset kept its secret."
    },
    {
      id: "empty",
      number: 4,
      title: "The Empty Roof",
      blurb: "You said nothing. Some stories end in silence."
    }
  ],

  start: "monday_class",

  nodes: {
    /* ───────────────────────── MONDAY ───────────────────────── */

    monday_class: {
      chapter: { day: "Monday", time: "4:06 PM", title: "The Note" },
      bg: "classroom",
      lines: [
        { text: `There are one thousand four hundred and sixty minutes in a school week.` },
        { text: `Most of them disappear. You sit. You nod. You watch the clock pretend to move.` },
        { text: `This was minute three hundred and twelve.` },
        { text: `I remember because it was the minute everything changed.` },
        { text: `Fourth period. The window beside my desk was open, and the curtain kept breathing in and out like it was bored too.` },
        { who: "Jun", text: `Kai. Kai. You're doing the thing again.` },
        { who: "Kai", voice: "huh", text: `What thing?` },
        { who: "Jun", text: `The thing where you stare at a wall like it owes you money.` },
        { text: `I was about to defend my honor when my hand brushed something inside my desk.` },
        { text: `A folded square of paper. Crisp edges. A tiny paper crane drawn in the corner.` },
        { who: "Kai", text: `This wasn't here this morning.` },
        { who: "Jun", voice: "oh", text: `Ohhh. Secret admirer.` },
        { who: "Kai", text: `Or someone finally complaining about my handwriting.` },
        { text: `I unfolded it under the desk.` },
        { type: "note", text: `Rooftop. 4:10. Come alone.\n\n— a friend` },
        { who: "Jun", text: `You're going, right?` },
        { who: "Kai", text: `I'm thinking about it.` },
        { who: "Jun", text: `You're already planning what to wear.` }
      ],
      next: "monday_choice"
    },

    monday_choice: {
      prompt: "What do you tell Jun?",
      choices: [
        {
          text: `Tell him everything.`,
          effects: { toldJun: true },
          next: "monday_told"
        },
        {
          text: `Play it cool.`,
          effects: { toldJun: false },
          next: "monday_cool"
        }
      ]
    },

    monday_told: {
      lines: [
        { who: "Jun", text: `A secret note and a rooftop meeting. This is the best thing that's happened to this school since the vending machine started giving two drinks.` },
        { who: "Kai", text: `That was a glitch.` },
        { who: "Jun", text: `A beautiful glitch.` },
        { who: "Jun", text: `If it's a prank, I want credit. If it's love, I want ten percent.` },
        { who: "Kai", text: `You're impossible.` },
        { who: "Jun", text: `And yet. Best friend.` }
      ],
      next: "monday_roof"
    },

    monday_cool: {
      lines: [
        { who: "Kai", text: `I'll figure it out.` },
        { who: "Jun", text: `You're going. I can tell.` },
        { who: "Kai", text: `How?` },
        { who: "Jun", text: `You've got that face. The "I'm about to do something stupid" face.` },
        { who: "Kai", text: `That's just my face.` },
        { who: "Jun", text: `Exactly.` },
        { text: `I hated that he was right.` }
      ],
      next: "monday_roof"
    },

    monday_roof: {
      bg: "rooftop",
      lines: [
        { text: `After school, I climbed four flights of stairs and pushed open the door to the roof.` },
        { text: `The wind hit me first. Then the light.` },
        { text: `The roof was empty.` },
        { text: `Of course it was empty. This was exactly the kind of thing that happened to me.` },
        { text: `Then I saw it: a paper crane balanced on the railing, its wings trembling in the wind.` },
        { text: `There was writing on one wing.` },
        { type: "note", text: `You came. I knew you would.\n\nLeave your answer under the third cherry tree by the gate.\n\n— your friend` },
        { who: "Kai", text: `This is either the most romantic thing that's ever happened to me, or an elaborate prank with excellent stationery.` },
        { text: `I turned the crane over. Whoever folded it had creased the left wing crooked. Just a little.` }
      ],
      next: "monday_answer_choice"
    },

    monday_answer_choice: {
      prompt: "What do you write back?",
      choices: [
        {
          text: `Write: "Who are you?"`,
          effects: { wroteOpen: true },
          next: "monday_answer_open"
        },
        {
          text: `Write: "See you tomorrow."`,
          effects: { wroteOpen: false },
          next: "monday_answer_playful"
        }
      ]
    },

    monday_answer_open: {
      bg: "gate",
      lines: [
        { text: `I found a blank page in my notebook and wrote, as neatly as I could: Who are you?` },
        { text: `Then, after a pause: And how long have you been watching me?` },
        { text: `I folded it twice and tucked it under the third cherry tree before I could chicken out.` }
      ],
      next: "monday_stairs"
    },

    monday_answer_playful: {
      bg: "gate",
      lines: [
        { text: `I wrote: See you tomorrow.` },
        { text: `Then I added: You'd better bring snacks.` },
        { text: `I left it under the third cherry tree and walked away pretending my heart wasn't doing something stupid.` }
      ],
      next: "monday_stairs"
    },

    monday_stairs: {
      bg: "gate",
      portrait: "mira_neutral",
      lines: [
        { text: `I was halfway back to the school when I nearly tripped over someone sitting on the steps.` },
        { who: "Mira", voice: "oh", text: `Oh— Kai. Hi. I didn't— the stairs are nice. For sitting.` },
        { who: "Kai", text: `They're good stairs.` },
        { text: `She laughed. Then she looked at the roof door behind me, and the laugh folded itself away.` },
        { portrait: "mira_blush", who: "Mira", text: `Did you... find anything? Up there?` },
        { who: "Kai", text: `Depends. What would I find?` },
        { portrait: "mira_sad", who: "Mira", voice: "ah", text: `Nothing. Forget it. I have to go. Books. I mean— the library. Bye.` },
        { portrait: "mira_neutral", text: `She left a paper crane on the step. I picked it up before the wind could.` },
        { text: `Crooked left wing.` }
      ],
      next: "tuesday_class"
    },

    /* ───────────────────────── TUESDAY ───────────────────────── */

    tuesday_class: {
      chapter: { day: "Tuesday", time: "12:41 PM", title: "Paper Cranes" },
      bg: "classroom",
      portrait: null,
      lines: [
        { text: `Tuesday arrived with a headache and a note in my bag that I had read eleven times.` },
        { who: "Jun", text: `You look terrible.` },
        { who: "Kai", voice: "hm", text: `Thanks.` },
        { who: "Jun", text: `No, like— dramatically terrible. Like a poet who forgot to eat.` },
        { who: "Kai", text: `I slept three hours.` },
        { who: "Jun", text: `Found your mystery person yet?` },
        { who: "Kai", text: `I have one crane, two hours of sleep, and no evidence.` },
        { who: "Jun", text: `That's more evidence than most people have.` },
        { text: `Elena appeared at my desk the way she appeared everywhere: like she had been copied and pasted there, perfectly organized.` },
        { who: "Elena", text: `Kai. A little bird told me someone left a note in your desk.` },
        { who: "Jun", text: `A little bird with a big mouth.` },
        { who: "Elena", text: `I'm class representative. It's my job to know when someone's being harassed.` },
        { who: "Kai", text: `Who said I was being harassed?` },
        { who: "Elena", text: `Your face.` },
        { text: `She waited, eyebrows raised, with the patience of someone who always got the answer.` }
      ],
      next: "tuesday_choice"
    },

    tuesday_choice: {
      prompt: "What do you do about the note?",
      choices: [
        {
          text: `Show Elena the note.`,
          effects: { toldElena: true },
          next: "tuesday_elena_show"
        },
        {
          text: `Keep it between us.`,
          effects: { toldElena: false },
          next: "tuesday_elena_keep"
        }
      ]
    },

    tuesday_elena_show: {
      lines: [
        { who: "Elena", text: `Neat handwriting. Careful. This isn't a prank, Kai.` },
        { who: "Elena", text: `People who write notes like this are either very shy or very dramatic.` },
        { who: "Kai", text: `Could be both.` },
        { who: "Elena", text: `Could be. Keep it quiet. And maybe don't tell the whole school.` },
        { who: "Kai", text: `You are the whole school.` },
        { who: "Elena", text: `Exactly.` }
      ],
      next: "tuesday_library"
    },

    tuesday_elena_keep: {
      lines: [
        { who: "Elena", text: `Fine. Keep your secrets.` },
        { who: "Elena", text: `But if you show up tomorrow with a rose between your teeth, I'm transferring.` },
        { who: "Jun", text: `Can I watch?` },
        { who: "Elena", text: `No.` }
      ],
      next: "tuesday_library"
    },

    tuesday_library: {
      bg: "library",
      portrait: "mira_neutral",
      lines: [
        { text: `After school, I went to the library to look up paper folding. That was my story, anyway.` },
        { text: `Mira was at the returns cart, sliding books into place like she was putting them to sleep.` },
        { who: "Kai", text: `You work here?` },
        { who: "Mira", text: `Tuesdays and Thursdays. It's quiet.` },
        { who: "Kai", text: `I'm looking for a book on origami.` },
        { who: "Mira", text: `Any particular reason?` },
        { who: "Kai", voice: "hm", text: `Research.` },
        { who: "Mira", text: `For a class?` },
        { who: "Kai", text: `For a... personal project.` },
        { text: `Something flickered across her face. Surprise, maybe. Or the shadow of a smile.` },
        { text: `She led me to a shelf near the window. Her fingers were covered in tiny paper cuts and ink smudges.` },
        { text: `A crane's wing poked out from between the pages of her sketchbook.` },
        { who: "Mira", text: `Here. This one has good diagrams.` },
        { text: `A paper crane slipped from the book and landed at my feet.` },
        { portrait: "mira_blush", who: "Mira", voice: "eh", text: `...That's old. It was already there. Probably.` }
      ],
      next: "tuesday_crane_choice"
    },

    tuesday_crane_choice: {
      prompt: "The crane is right there.",
      choices: [
        {
          text: `Compare it to the note.`,
          effects: { clues: 1, checkedCrane: true },
          next: "tuesday_compare"
        },
        {
          text: `Let it slide.`,
          effects: { checkedCrane: false },
          next: "tuesday_slide"
        }
      ]
    },

    tuesday_compare: {
      portrait: "mira_blush",
      lines: [
        { text: `I pulled the note from my pocket and held it beside the crane.` },
        { text: `Crooked left wing. Same angle. Same tiny extra fold near the tail.` },
        { who: "Kai", text: `Lots of people fold cranes.` },
        { who: "Mira", voice: "hm", text: `Yes. Lots.` },
        { who: "Kai", text: `But not with a crooked left wing.` },
        { text: `She looked at the window. Her ears had gone red.` },
        { who: "Mira", text: `You should... read the book. The diagrams are good.` },
        { text: `She was gone before I could say anything else.` }
      ],
      next: "tuesday_close"
    },

    tuesday_slide: {
      portrait: "mira_smile",
      lines: [
        { text: `I picked up the crane and set it on the shelf.` },
        { who: "Kai", text: `Nice crane.` },
        { who: "Mira", text: `It's— just paper.` },
        { who: "Kai", text: `Still nice.` },
        { text: `She looked at me for a second too long, then smiled at the carpet.` }
      ],
      next: "tuesday_close"
    },

    tuesday_close: {
      bg: "gate",
      portrait: null,
      lines: [
        { text: `When I opened my bag that night, a new note was tucked between my notebooks.` },
        { type: "note", text: `Rain tomorrow. Bring an umbrella.\n\nSome things are easier to say when the world is quiet.\n\n— a friend` },
        { who: "Kai", voice: "oh", text: `Right. An umbrella.` }
      ],
      next: "wednesday_rain"
    },

    /* ───────────────────────── WEDNESDAY ───────────────────────── */

    wednesday_rain: {
      chapter: { day: "Wednesday", time: "3:58 PM", title: "The Kind of Brave Rain Makes" },
      bg: "hallway",
      portrait: "mira_neutral",
      lines: [
        { text: `Wednesday arrived in shades of grey. Rain ran down the hallway windows in long, nervous lines.` },
        { text: `I had forgotten an umbrella. Of course I had.` },
        { text: `At the entrance, Mira stood under a clear umbrella, watching the rain like it was a movie she'd already seen.` }
      ],
      next: "wednesday_choice"
    },

    wednesday_choice: {
      prompt: "She's right there.",
      choices: [
        {
          text: `Offer to share her umbrella.`,
          effects: { sharedUmbrella: true, clues: 1 },
          next: "wed_share"
        },
        {
          text: `Make a run for it.`,
          effects: { sharedUmbrella: false },
          next: "wed_run"
        }
      ]
    },

    wed_share: {
      portrait: "mira_smile",
      lines: [
        { who: "Kai", text: `Waiting for someone?` },
        { who: "Mira", voice: "ah", text: `The rain. I mean— no. Just waiting.` },
        { who: "Kai", text: `I forgot mine.` },
        { text: `She looked at her umbrella. Then at me. Then at the umbrella again.` },
        { who: "Mira", text: `I have room. If you want. It's a big umbrella. For an umbrella.` },
        { who: "Kai", text: `That's the most convincing pitch I've ever heard.` },
        { text: `We walked. She held the umbrella too high, because I was taller. I took it and tilted it toward her.` },
        { text: `My shoulder got wet. I didn't care.` },
        { who: "Mira", text: `You're getting wet.` },
        { who: "Kai", text: `It's a sacrifice I'm willing to make.` },
        { text: `She laughed. A real one, not the polite one she used in class.` },
        { who: "Mira", text: `I like rain. Everything gets quieter. It's like the world gives you permission to be brave.` },
        { text: `I stopped walking.` },
        { who: "Kai", text: `What did you say?` },
        { who: "Mira", voice: "eh", text: `Nothing. Puddle. Watch the puddle.` },
        { text: `I looked down. There was no puddle.` },
        { text: `Some things are easier to say when the world is quiet. She had said it without blinking.` },
        { text: `I walked the rest of the way home grinning at the rain like an idiot.` }
      ],
      next: "wed_close"
    },

    wed_run: {
      portrait: null,
      lines: [
        { who: "Kai", text: `I'll make it.` },
        { text: `I ran. The rain won.` },
        { text: `By the time I got home, I was soaked through and my shoes were making a sound like a dying accordion.` },
        { text: `There was a note on my desk. I don't know how it got there. I didn't ask.` },
        { type: "note", text: `You should have waited.\n\nI would have shared.\n\n— a friend` },
        { who: "Kai", voice: "urgh", text: `...I'm an idiot.` }
      ],
      next: "wed_close"
    },

    wed_close: {
      bg: "gate",
      portrait: null,
      lines: [
        { text: `Thursday, I told myself, I would pay attention.` },
        { text: `Thursday, I would figure it out.` }
      ],
      next: "thursday_elena"
    },

    /* ───────────────────────── THURSDAY ───────────────────────── */

    thursday_elena: {
      chapter: { day: "Thursday", time: "5:02 PM", title: "The Almost Answer" },
      bg: "classroom",
      portrait: null,
      lines: [
        { text: `Elena was waiting for me after the last bell. She had a paper crane in her hand and the expression of a lawyer about to win.` },
        { who: "Elena", text: `Okay. Full disclosure. I didn't write the notes.` },
        { who: "Kai", text: `I didn't ask.` },
        { who: "Elena", text: `You were thinking it.` },
        { who: "Kai", text: `I was thinking about lunch.` },
        { who: "Elena", text: `You're a terrible liar. Here's what I know: I saw someone coming down from the roof on Monday.` },
        { who: "Elena", text: `I'm not going to say who.` },
        { who: "Kai", text: `That's not helpful.` },
        { who: "Elena", text: `It is if you use your eyes. You've been walking past the answer all week.` }
      ],
      next: "thursday_choice"
    },

    thursday_choice: {
      prompt: "Elena is waiting.",
      choices: [
        {
          text: `Trust her. Think it through.`,
          effects: { trustedElena: true, clues: 1 },
          next: "thurs_trust"
        },
        {
          text: `Accuse her.`,
          effects: { trustedElena: false },
          next: "thurs_accuse"
        }
      ]
    },

    thurs_trust: {
      lines: [
        { who: "Kai", text: `Why are you helping me?` },
        { who: "Elena", text: `Because I've watched you two orbit each other for a month.` },
        { who: "Kai", text: `Two?` },
        { who: "Elena", text: `Kai. Come on.` },
        { text: `She said it like it was obvious. Like the whole school had figured it out except me.` },
        { text: `A paper crane. A crooked wing. Paper cuts. The way she looked at the roof door behind me.` },
        { who: "Kai", voice: "oh", text: `Oh.` },
        { who: "Elena", voice: "ah", text: `There it is.` }
      ],
      next: "thurs_note"
    },

    thurs_accuse: {
      lines: [
        { who: "Kai", text: `It's you, isn't it?` },
        { who: "Elena", voice: "huh", text: `Me?` },
        { who: "Kai", text: `You're always around. You knew about the note. You have a paper crane.` },
        { who: "Elena", text: `I have a paper crane because I confiscated it from the recycling bin.` },
        { who: "Elena", text: `And I'm always around because I'm class representative.` },
        { who: "Kai", text: `...That's a very good alibi.` },
        { who: "Elena", text: `It's not an alibi. It's my life.` },
        { text: `She sighed and handed me the crane. Crooked left wing.` },
        { who: "Elena", voice: "sigh", text: `Think harder, Kai. Please. For all of us.` }
      ],
      next: "thurs_note"
    },

    thurs_note: {
      bg: "classroom",
      lines: [
        { text: `There was a note waiting in my literature textbook.` },
        { type: "note", text: `Tomorrow. Last sunset.\n\nIf you know my name, say it.\n\nIf you don't... I understand.\n\n— your friend` },
        { who: "Kai", voice: "hm", text: `Last sunset?` },
        { text: `I read it four times. Then I went to find Jun.` }
      ],
      next: "friday_jun"
    },

    friday_jun: {
      bg: "gate",
      portrait: null,
      lines: [
        { text: `Jun was at the school gate, eating a convenience-store bun like it was a full-course meal.` },
        { who: "Kai", text: `I think I know who's been writing the notes.` },
        { who: "Jun", text: `Finally. I've known since Tuesday.` },
        { who: "Kai", voice: "huh", text: `You what?` },
        { who: "Jun", text: `You're not exactly subtle. Neither is she.` },
        { who: "Kai", text: `Why didn't you tell me?` },
        { who: "Jun", text: `Because it's your story. I'm just the comic relief.` },
        { who: "Kai", text: `You're more than that.` },
        { who: "Jun", text: `Don't get emotional. You'll make me drop my bun.` },
        { text: `He grinned. Then he looked at the sunset and said, quieter: "Go find your last sunset."` }
      ],
      next: "friday_roof"
    },

    /* ───────────────────────── FRIDAY ───────────────────────── */

    friday_roof: {
      chapter: { day: "Friday", time: "6:14 PM", title: "The Last Sunset" },
      bg: "rooftop",
      portrait: null,
      lines: [
        { text: `The roof was gold. The kind of gold that makes everything look like a memory already.` },
        { text: `A single crane sat on the railing. I didn't pick it up. I didn't have to.` },
        {
          if: (s) => s.flags.clues >= 3,
          text: `All week, the answer had been folding itself into my hands. The crooked wing. The paper cuts. The rain. The way she said the stairs were nice.`
        },
        {
          if: (s) => s.flags.clues === 2,
          text: `Two clues. That was enough. It had been enough for a while. I'd just been too scared to put the pieces together.`
        },
        {
          if: (s) => s.flags.clues <= 1,
          text: `I had a handful of maybes and a sunset. Maybe that was enough.`
        },
        { text: `Behind me, the stairwell door clicked open. Then closed again.` },
        { text: `Whoever it was, they were waiting for me to speak first.` },
        { text: `So I did.` }
      ],
      next: "friday_choice"
    },

    friday_choice: {
      prompt: "Say it before the sun goes down.",
      choices: [
        {
          text: (s) => s.flags.clues >= 2 ? `Say her name. "Mira."` : `Take a guess. "Mira."`,
          next: "ending_sunset"
        },
        {
          text: `"I don't know your name. But I'd like to."`,
          next: "ending_letters"
        },
        {
          text: `"Elena."`,
          next: "ending_wrong"
        },
        {
          text: `Say nothing. Leave.`,
          next: "ending_empty"
        }
      ]
    },

    /* ───────────────────────── ENDINGS ───────────────────────── */

    ending_sunset: {
      ending: "sunset",
      bg: "rooftop",
      portrait: null,
      lines: [
        { text: `Behind me, someone let out a breath.` },
        { portrait: "mira_neutral", who: "Mira", voice: "ah", text: `You said my name.` },
        { who: "Kai", text: `You made it pretty hard to guess.` },
        { who: "Mira", text: `I folded a lot of cranes.` },
        { text: `She stepped out from behind the water tank. She was still holding a pen. There was ink on her fingers.` },
        { who: "Mira", text: `I'm sorry. I know this was weird. I'm not good at— saying things.` },
        { who: "Mira", text: `I thought if I wrote them, you'd hear them in my voice anyway.` },
        { who: "Kai", text: `I did.` },
        { who: "Mira", text: `Did you?` },
        { who: "Kai", text: `The crooked wing. The paper cuts. The rain line. The way you looked at the roof door.` },
        { who: "Mira", voice: "oh", text: `Oh.` },
        { who: "Kai", text: `Also, Jun says I'm not subtle.` },
        { who: "Mira", text: `He's right.` },
        {
          if: (s) => s.flags.clues <= 1,
          who: "Mira",
          text: `You guessed, didn't you?`
        },
        {
          if: (s) => s.flags.clues <= 1,
          who: "Kai",
          text: `Maybe. But I was paying attention.`
        },
        {
          if: (s) => s.flags.clues <= 1,
          who: "Mira",
          text: `That's what matters.`
        },
        {
          if: (s) => s.flags.toldJun,
          who: "Mira",
          text: `Jun knows, doesn't he?`
        },
        {
          if: (s) => s.flags.toldJun,
          who: "Kai",
          text: `Jun knew before I did.`
        },
        {
          if: (s) => s.flags.toldJun,
          who: "Mira",
          text: `He's going to be unbearable.`
        },
        {
          if: (s) => s.flags.toldJun,
          who: "Kai",
          text: `He already is.`
        },
        { text: `The sunset went from gold to rose. She looked at the crane on the railing, then at me.` },
        { portrait: "mira_sad", who: "Mira", text: `I'm moving at the end of next month. Dad's job. I wanted... I wanted one good thing to leave behind.` },
        { who: "Kai", text: `Then don't leave it behind. Write to me.` },
        { who: "Mira", text: `You'd write back?` },
        { who: "Kai", text: `I'll even use proper stationery.` },
        { text: `She laughed. The wind lifted the crane off the railing, and she caught it without looking, the way you catch something you've thrown a hundred times.` },
        { portrait: "mira_smile", who: "Mira", text: `One condition.` },
        { who: "Kai", voice: "huh", text: `What?` },
        { who: "Mira", text: `No more anonymous notes.` },
        { who: "Kai", text: `Deal.` },
        { portrait: "mira_blush", text: `But when I got home that night, there was a folded square of paper in my pocket. I didn't remember putting it there.` },
        { type: "note", text: `See you tomorrow.\n\n— Mira` },
        { text: `Some stories end with a sunset. Ours started with one.` }
      ]
    },

    ending_letters: {
      ending: "letters",
      bg: "rooftop",
      portrait: null,
      lines: [
        { text: `I said it to the sunset, not to her.` },
        { who: "Kai", text: `I don't know your name. But I'd like to.` },
        { text: `For a long moment, nothing happened.` },
        { text: `Then a crane came over the top of the water tank, riding a gust of wind. It landed at my feet.` },
        { text: `The note inside was in the same careful handwriting.` },
        { type: "note", text: `Then keep writing.\n\nI'll keep answering.\n\n— your friend` },
        { text: `I sat down on the roof and wrote my first real letter. It took me an hour.` },
        { text: `On Monday, a return letter was in my desk. On Wednesday, another. On Friday, one with a pressed cherry blossom inside.` },
        { text: `We never did meet on that roof. Not that year.` },
        { text: `But every letter felt like standing in a sunset.` },
        { text: `Some people, they never say. I'd like to.` }
      ]
    },

    ending_wrong: {
      ending: "wrong",
      bg: "rooftop",
      portrait: null,
      lines: [
        { who: "Kai", text: `Elena.` },
        { text: `The stairwell door opened.` },
        { who: "Elena", voice: "hm", text: `Did someone say my name?` },
        { text: `She was holding a stack of student council forms. She looked around the empty roof, then at me.` },
        { who: "Elena", text: `Kai. Why are you standing here alone?` },
        { who: "Kai", voice: "ah", text: `I thought—` },
        { text: `The crane on the railing tipped over. The note inside fluttered loose before I could catch it.` },
        { type: "note", text: `It's okay.\n\nI should have been braver.\n\n— your friend` },
        { who: "Elena", text: `Kai? Who did you think I was?` },
        { text: `I looked at the note. At the crooked wing. At the door to the stairs.` },
        { bg: "gate", text: `By the time I got downstairs, the cherry trees were empty.` },
        { bg: "classroom", text: `On Monday, her seat was still there. That was the worst part. It was still there, and she wasn't.` },
        { text: `Some names are easier to say than others. I learned that one too late.` }
      ]
    },

    ending_empty: {
      ending: "empty",
      bg: "rooftop",
      portrait: null,
      lines: [
        { text: `I didn't say anything.` },
        { text: `The sunset didn't wait for me. It kept going, gold to rose to grey.` },
        { text: `I left the roof. Behind me, the stairwell door opened. I didn't turn around.` },
        { bg: "classroom", text: `On Monday, Mira's seat was empty.` },
        { who: "Jun", text: `She left this for you.` },
        { text: `A paper crane. Crooked left wing. No note inside.` },
        { who: "Elena", text: `She transferred. I thought you knew.` },
        { text: `I held the crane for a long time.` },
        { text: `Some notes are only meant to be written, not read.` }
      ]
    }
  }
};
