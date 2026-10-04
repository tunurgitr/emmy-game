// ==========================================================================
//  Emmy's Blind Bag Town — procedural 3D toys (no model files).
//
//  Six blind-bag series × 12 characters, plus special finishes (glitter,
//  glow-in-the-dark, chrome, galaxy, crystal, golden, ultra rainbow) and one
//  secret chicken hiding in every series. Every toy is built from simple
//  shapes with a kawaii face; buildItem(item) → THREE.Group (feet on y = 0).
// ==========================================================================
import { THREE, rnd, emojiTexture } from "../arcade3d/lib.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { makeChicken, CHICKEN_COLORS } from "../dumpling3d/models.js";
export { makeChicken, CHICKEN_COLORS };

const TAU = Math.PI * 2, V3 = THREE.Vector3;
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

// ---- rarities ---------------------------------------------------------------
export const RARITY = {
  common:    { name: "Common",        color: "#8f9aa6", order: 0, value: 2 },
  uncommon:  { name: "Uncommon",      color: "#2fae66", order: 1, value: 4 },
  rare:      { name: "Rare",          color: "#3d8bfd", order: 2, value: 8 },
  epic:      { name: "Epic",          color: "#9b59ff", order: 3, value: 15 },
  legendary: { name: "Legendary",     color: "#ff9800", order: 4, value: 30 },
  mythic:    { name: "Mythic",        color: "#ff3d9a", order: 5, value: 50 },
  secret:    { name: "Secret",        color: "#11a597", order: 6, value: 80 },
  golden:    { name: "Golden",        color: "#d99a00", order: 7, value: 120 },
  rainbow:   { name: "Ultra Rainbow", color: "#ff5da2", order: 8, value: 200 },
};
export const RARITY_IDS = Object.keys(RARITY);

// ---- the six series -----------------------------------------------------------
//  each character: [id, name, rarity, emoji, blurb, params]
export const SERIES = {
  snacks: { name: "Squishy Snacks", ico: "🍩", colors: ["#ff9ac8", "#ffe08a"], tag: "Slow-rise squishies that smell like… nothing. But they LOOK yummy!", chars: [
    ["donut", "Sprinkle Donut", "common", "🍩", "Covered in sprinkles. Has never once been on time.", { kind: "donut", c: 0xff8ac8 }],
    ["toast", "Toasty", "common", "🍞", "Warm, crunchy and always a little bit buttery.", { kind: "toast" }],
    ["berry", "Berry Sweet", "common", "🍓", "Says 'berry' instead of 'very'. Berry annoying. Berry cute.", { kind: "berry" }],
    ["peach", "Peachy Keen", "common", "🍑", "Everything is just peachy!", { kind: "peach" }],
    ["cupcake", "Cupcake Cutie", "common", "🧁", "Frosting first, questions later.", { kind: "cupcake", c: 0xb98cff }],
    ["boba", "Boba Buddy", "uncommon", "🧋", "Full of chewy pearls and good vibes.", { kind: "boba" }],
    ["icecream", "Double Scoop", "uncommon", "🍦", "Two scoops are better than one. Three is showing off.", { kind: "icecream" }],
    ["croissant", "Flaky Croissant", "uncommon", "🥐", "Speaks a tiny bit of French. Mostly 'oui oui'.", { kind: "croissant" }],
    ["melon", "Melon Smile", "uncommon", "🍉", "One in a melon!", { kind: "melon" }],
    ["taco", "Taco Tuesday", "rare", "🌮", "Thinks every day is Tuesday.", { kind: "taco" }],
    ["avocado", "Avo-Cuddle", "rare", "🥑", "Hugs you. Keeps its pit. Very attached.", { kind: "avocado" }],
    ["cloud", "Cloud Bun", "epic", "☁️", "A fluffy bun from the sky. Rains sprinkles when happy.", { kind: "cloud" }],
  ] },
  hunters: { name: "Pop Star Spirit Hunters", ico: "🎤", colors: ["#7a3cff", "#ff5da2"], tag: "A sparkly pop-idol trio who sing the grumpy spirits back into happy ones!", chars: [
    ["ghost-grumble", "Grumble Ghostie", "common", "👻", "Grumpy until it hears a catchy chorus. Then it dances.", { kind: "ghost", c: 0xc9b6ff, mood: "grumpy" }],
    ["ghost-sneezy", "Sneezy Spirit", "common", "🤧", "ACHOO! Oops, sorry. Spirits get colds too.", { kind: "ghost", c: 0xa8dcff, mood: "wink" }],
    ["ghost-giggle", "Giggle Ghost", "common", "😆", "Laughs at every joke. Even the bad ones. Especially the bad ones.", { kind: "ghost", c: 0xffc2e0, mood: "open" }],
    ["mic", "Glow Mic", "common", "🎤", "Mic check, one, two, three — sparkle!", { kind: "mic" }],
    ["sword", "Star Sword", "common", "🗡️", "A glowing practice sword stuck in a very friendly rock.", { kind: "sword" }],
    ["kiki", "Kiki", "uncommon", "🎶", "The singer! Can hold a note for 47 seconds.", { kind: "idol", hair: 0xff5da2, style: "bob", outfit: 0xffffff, accent: 0xff5da2, prop: "mic" }],
    ["sunny", "Sunny", "uncommon", "🌟", "The dancer! Does a cartwheel every time she's happy.", { kind: "idol", hair: 0xffcf3a, style: "buns", outfit: 0xff8a3d, accent: 0xfff3a0, prop: "fan" }],
    ["rio", "Rio", "uncommon", "🎸", "The drummer! Taps a beat on everything. Everything.", { kind: "idol", hair: 0x3d8bfd, style: "short", outfit: 0x222244, accent: 0x00e5ff, prop: "sticks", skin: 0xc68642 }],
    ["stick", "Lucky Light Stick", "uncommon", "🪄", "Wave it at a concert and your wish… probably comes true!", { kind: "lightstick", c: 0xff5da2 }],
    ["jade", "Jade", "rare", "💚", "The rapper! Rhymes 'spirit' with 'can't hear it'.", { kind: "idol", hair: 0x15b36a, style: "ponytail", outfit: 0x2a1a5e, accent: 0x7cffb0, prop: "wand", skin: 0xe0ac8a }],
    ["nova", "Nova", "rare", "⚔️", "The leader! Her glowing sword plays a song when she swings it.", { kind: "idol", hair: 0x7a3cff, style: "long", outfit: 0x1d1d3a, accent: 0xff3dd6, prop: "sword" }],
    ["puff", "Captain Puff", "epic", "🦊", "The band's fluffy blue fox mascot. Hat stays on through every dance move.", { kind: "critter", a: "bluefox" }],
  ] },
  cluck: { name: "Cluck Club", ico: "🐔", colors: ["#ffd54a", "#ff7043"], tag: "Chickens. In costumes. You're welcome.", chars: [
    ["hen", "Classic Hen", "common", "🐔", "Just a regular chicken. Or IS it?? (It is.)", { kind: "chicken", col: 0 }],
    ["chick", "Baby Chick", "common", "🐥", "Peep.", { kind: "chicken", chick: true }],
    ["pirate", "Pirate Chicken", "common", "🏴‍☠️", "Arrr! Searches the seven seas for buried corn.", { kind: "chicken", col: 1, acc: "pirate" }],
    ["chef", "Chef Chicken", "common", "👨‍🍳", "Makes amazing pancakes. Do NOT ask about omelettes.", { kind: "chicken", col: 0, acc: "chef" }],
    ["disco", "Disco Chicken", "uncommon", "🪩", "Has a rainbow afro and the best dance moves on the farm.", { kind: "chicken", col: 7, acc: "disco" }],
    ["astro", "Astro-Chick", "uncommon", "🚀", "First chicken on the moon. Flew there. Chickens can't fly. Nobody knows how.", { kind: "chicken", col: 5, acc: "astro" }],
    ["wizard", "Wizard Chicken", "uncommon", "🧙", "Its only spell turns things into slightly different chickens.", { kind: "chicken", col: 4, acc: "wizard" }],
    ["princess", "Princess Cluckington", "uncommon", "👑", "Royal, fabulous, and allowed to peck the king.", { kind: "chicken", col: 6, acc: "crown" }],
    ["ninja", "Ninja Chicken", "rare", "🥷", "So sneaky you'll never see it coming. BAWK! See? Too late.", { kind: "chicken", col: 3, acc: "ninja" }],
    ["super", "Super Chicken", "rare", "🦸", "Faster than a speeding egg! Able to leap tall fences in a single flap!", { kind: "chicken", col: 2, acc: "cape" }],
    ["rubber", "Rubber Chicken", "rare", "🤡", "Squeeze it! SQUAAAAAWK!", { kind: "rubber" }],
    ["nugget", "Chicken Nugget", "epic", "🍗", "A chicken dressed as a chicken nugget. Nobody knows why. Not even the chicken.", { kind: "chicken", col: 9, acc: "nugget" }],
  ] },
  spuds: { name: "Silly Spuds", ico: "🥔", colors: ["#c8935a", "#8fd16a"], tag: "Potatoes with personality. Some say too much personality.", chars: [
    ["mustache", "Mustache Spud", "common", "🥸", "Grew this mustache all by itself. Very proud.", { kind: "spud", acc: "mustache" }],
    ["cool", "Cool Spud", "common", "😎", "Too cool for the fridge.", { kind: "spud", acc: "shades" }],
    ["baby", "Baby Tater", "common", "🍼", "Just a small potato. A tater tot, if you will.", { kind: "spud", acc: "bow", small: true }],
    ["couch", "Couch Potato", "common", "🛋️", "Has not moved since Tuesday. Doesn't plan to.", { kind: "spud", acc: "couch" }],
    ["party", "Party Potato", "common", "🥳", "Every day is a potato party! (Bring dip.)", { kind: "spud", acc: "party" }],
    ["sweet", "Sweet Potato", "uncommon", "💗", "The sweetest potato you'll ever meet. Gives out hugs.", { kind: "spud", acc: "hearts", c: 0xe9785a }],
    ["business", "Business Spud", "uncommon", "💼", "Has very important meetings about… gravy.", { kind: "spud", acc: "tie" }],
    ["fry", "Fry Guy", "uncommon", "🍟", "A whole box of potato friends. Never alone.", { kind: "fries" }],
    ["mashed", "Mashed Potato", "uncommon", "🧈", "Had a rough day. Still smiling. Wearing butter like a hat.", { kind: "mashed" }],
    ["space", "Spud-nik", "rare", "🪐", "The first potato in orbit. Has its own ring.", { kind: "spud", acc: "space", c: 0xb8a0ff }],
    ["royal", "Royal Russet", "rare", "🤴", "King of the Root Cellar. Rules fairly. Mostly naps.", { kind: "spud", acc: "royal" }],
    ["hot", "Hot Potato", "epic", "🔥", "Ouch! Ouch! Pass it on! Pass it on!", { kind: "spud", acc: "hot", c: 0xff7a45 }],
  ] },
  pets: { name: "Pocket Pets", ico: "🐾", colors: ["#7ad3ff", "#ffb3d1"], tag: "Tiny squishy animal friends that fit in your pocket.", chars: [
    ["kitten", "Kitten", "common", "🐱", "Naps 18 hours a day. Busy the other 6.", { kind: "critter", a: "kitten" }],
    ["puppy", "Puppy", "common", "🐶", "Has never met a stranger. Everyone is its best friend.", { kind: "critter", a: "puppy" }],
    ["bunny", "Bunny", "common", "🐰", "Hop hop hop. That's it. That's the whole personality.", { kind: "critter", a: "bunny" }],
    ["hamster", "Hamster", "common", "🐹", "Stores snacks in its cheeks for later. Later never comes.", { kind: "critter", a: "hamster" }],
    ["panda", "Panda", "common", "🐼", "Eats bamboo, rolls around, eats more bamboo.", { kind: "critter", a: "panda" }],
    ["penguin", "Penguin", "uncommon", "🐧", "Always dressed for a fancy party.", { kind: "critter", a: "penguin" }],
    ["fox", "Fox", "uncommon", "🦊", "What does the fox say? Mostly 'hi'.", { kind: "critter", a: "fox" }],
    ["frog", "Froggy", "uncommon", "🐸", "Ribbit is its favourite word. Also its only word.", { kind: "critter", a: "frog" }],
    ["axolotl", "Axolotl", "uncommon", "🩷", "Always smiling. Has frilly gills like a party hat.", { kind: "critter", a: "axolotl" }],
    ["sloth", "Sloth", "rare", "🦥", "Will… get… back… to… you…", { kind: "critter", a: "sloth" }],
    ["unicorn", "Unicorn", "rare", "🦄", "Sparkly, magical, and LOVES pancakes.", { kind: "critter", a: "unicorn" }],
    ["dragon", "Baby Dragon", "epic", "🐉", "Breathes tiny puffs of glitter instead of fire.", { kind: "critter", a: "dragon" }],
  ] },
  faces: { name: "Glow-Up Faces", ico: "💖", colors: ["#ff8ac8", "#c9a8ff"], tag: "They've been playing outside! Clean them up, brush their fluff and make them beautiful.", chars: [
    ["bunny", "Bunny Face", "common", "🐰", "Hopped through a mud puddle. Twice.", { kind: "face", a: "bunny" }],
    ["kitty", "Kitty Face", "common", "🐱", "Got cookie crumbs everywhere. Everywhere.", { kind: "face", a: "kitten" }],
    ["puppy", "Puppy Face", "common", "🐶", "Dug a hole in the garden. Found a sock. Worth it.", { kind: "face", a: "puppy" }],
    ["bear", "Bear Face", "common", "🐻", "Fell asleep in the paint corner at school.", { kind: "face", a: "bear" }],
    ["chick", "Chick Face", "common", "🐥", "Played in the hay all day. Peep!", { kind: "face", a: "chick" }],
    ["panda", "Panda Face", "uncommon", "🐼", "Rolled down a hill. On purpose. Again.", { kind: "face", a: "panda" }],
    ["lamb", "Lamb Face", "uncommon", "🐑", "Its wool is SO fluffy (and SO tangled).", { kind: "face", a: "lamb" }],
    ["froggy", "Froggy Face", "uncommon", "🐸", "Jumped in every puddle in town.", { kind: "face", a: "frog" }],
    ["hamster", "Hamster Face", "uncommon", "🐹", "Ran on its wheel all night. Fluff everywhere.", { kind: "face", a: "hamster" }],
    ["fox", "Fox Face", "rare", "🦊", "Went exploring in the woods. Came back leafy.", { kind: "face", a: "fox" }],
    ["unicorn", "Unicorn Face", "rare", "🦄", "Painted a rainbow. Mostly on itself.", { kind: "face", a: "unicorn" }],
    ["dragon", "Dragon Face", "epic", "🐉", "Sneezed glitter all over its own face.", { kind: "face", a: "dragon" }],
  ] },
  dinos: { name: "Dino Eggs", ico: "🦖", colors: ["#6fcf5a", "#ffd54a"], tag: "Every bag has an egg inside. Tap it until it cracks — who's going to hatch?", chars: [
    ["rex", "T-Rex", "common", "🦖", "Tiny arms, BIG hugs. Well… small hugs.", { kind: "dino", a: "rex", c: 0x6fcf5a }],
    ["trike", "Triceratops", "common", "🦕", "Three horns, zero grumpiness.", { kind: "dino", a: "trike", c: 0x6ec6ff }],
    ["stego", "Stegosaurus", "common", "🦕", "Its back plates are great for drying socks.", { kind: "dino", a: "stego", c: 0xffa94d }],
    ["long", "Longneck", "common", "🦒", "Can see over every fence. Knows everybody's business.", { kind: "dino", a: "long", c: 0xb18cff }],
    ["raptor", "Raptor", "common", "🦖", "Super fast. Mostly runs to get snacks.", { kind: "dino", a: "raptor", c: 0xff8ac8 }],
    ["ptero", "Pterodactyl", "uncommon", "🪽", "Flaps very hard. Flies a little bit.", { kind: "dino", a: "ptero", c: 0x4fc3c3 }],
    ["anky", "Ankylosaurus", "uncommon", "🛡️", "Built like a bumpy little tank. Gives very bonky hugs.", { kind: "dino", a: "anky", c: 0xc9a26b }],
    ["para", "Parasaurolophus", "uncommon", "🎺", "Toots its head crest like a trumpet. TOOOOT!", { kind: "dino", a: "para", c: 0xffd54a }],
    ["spino", "Spinosaurus", "uncommon", "⛵", "Has a sail on its back. Still can't go sailing.", { kind: "dino", a: "spino", c: 0x3d8bfd }],
    ["baby", "Baby Dino", "rare", "🥚", "Just hatched. Still wearing its eggshell as a hat.", { kind: "dino", a: "baby", c: 0x9ff0c8 }],
    ["chicko", "Chick-o-saurus", "rare", "🐔", "Scientists say chickens are dinosaurs. This one agrees. BAWK-RAWR!", { kind: "dino", a: "chicko", c: 0xffe066 }],
    ["lava", "Lava Rex", "epic", "🌋", "Hatched in a volcano. Loves spicy tacos and warm hugs.", { kind: "dino", a: "rex", c: 0xff6a3d, lava: true }],
  ] },
  slime: { name: "Slime Pots", ico: "🫧", colors: ["#7cffb0", "#6ec6ff"], tag: "Stretchy, squishy, pokey slime. Not for eating. (We checked.)", chars: [
    ["cloud", "Cloud Fluff Slime", "common", "☁️", "So fluffy it might float away.", { kind: "slime", c: 0xcfeaff, lid: 0x6ec6ff }],
    ["butter", "Butter Slime", "common", "🧈", "Spreads like butter. Do NOT put it on toast.", { kind: "slime", c: 0xffe58a, lid: 0xffb300 }],
    ["gum", "Bubblegum Slime", "common", "🍬", "Smells like bubblegum. Tastes like… don't.", { kind: "slime", c: 0xff9ac8, lid: 0xff3d9a }],
    ["mint", "Minty Fresh Slime", "common", "🌿", "Cool and minty and very, very stretchy.", { kind: "slime", c: 0x9ff0c8, lid: 0x2fae66 }],
    ["grape", "Grape Jelly Slime", "common", "🍇", "See-through and jiggly like jelly.", { kind: "slime", c: 0xb18cff, lid: 0x7a3cff, clear: true }],
    ["crunchy", "Crunchy Bead Slime", "uncommon", "🔮", "Full of tiny beads that go crunch-crunch-crunch.", { kind: "slime", c: 0xfff7ff, lid: 0xff5da2, mix: "beads" }],
    ["snow", "Snow Fizz Slime", "uncommon", "❄️", "Fizzes like fresh snow when you squeeze it.", { kind: "slime", c: 0xf4f8ff, lid: 0x3d8bfd, mix: "snow" }],
    ["sea", "Fishbowl Slime", "uncommon", "🐟", "Clear blue slime with tiny fish charms swimming inside.", { kind: "slime", c: 0x3db8ff, lid: 0x1d5fbf, clear: true, mix: "fish" }],
    ["sunset", "Sunset Swirl Slime", "uncommon", "🌅", "Pink, orange and yellow all swirled up.", { kind: "slime", c: 0xffffff, lid: 0xff8a3d, swirl: ["#ff5d8f", "#ff9a3d", "#ffe066"] }],
    ["starry", "Starry Night Slime", "rare", "🌟", "Dark blue with real(ish) stars inside.", { kind: "slime", c: 0x2a2a7a, lid: 0xffd54a, mix: "stars" }],
    ["unicorn", "Unicorn Swirl Slime", "rare", "🦄", "Every colour of the rainbow, all in one blob.", { kind: "slime", c: 0xffffff, lid: 0xff8ac8, swirl: ["#ff8ac8", "#bfeaff", "#e6ccff", "#fff3a0", "#a8f0cf"] }],
    ["glow", "Glow Goo", "epic", "🟢", "Glows in the dark. Great nightlight. Bad pillow.", { kind: "slime", c: 0x9bff6a, lid: 0x222244, glowy: true }],
  ] },
  ocean: { name: "Ocean Buddies", ico: "🐠", colors: ["#3db8ff", "#7cffe0"], tag: "Squishy sea friends that swim around. Blub blub!", chars: [
    ["clown", "Clownfish", "common", "🐠", "Tells the best jokes under the sea.", { kind: "sea", a: "fish", c: 0xff8a3d, stripe: 0xffffff }],
    ["tang", "Blue Tang", "common", "🐟", "Keeps swimming. And swimming. Forgot where it was going.", { kind: "sea", a: "fish", c: 0x3d6bfd, fin: 0xffd23a }],
    ["octo", "Octopus", "common", "🐙", "Eight arms = eight hugs at once.", { kind: "sea", a: "octo", c: 0xff7ab8 }],
    ["crab", "Crab", "common", "🦀", "Walks sideways. Waves sideways. Says hi sideways.", { kind: "sea", a: "crab", c: 0xff5a4a }],
    ["star", "Starfish", "common", "⭐", "A star of the sea. Signs autographs.", { kind: "sea", a: "star", c: 0xffb347 }],
    ["turtle", "Sea Turtle", "uncommon", "🐢", "Slow and steady. Very, very steady.", { kind: "sea", a: "turtle", c: 0x6ccf7a }],
    ["puffer", "Pufferfish", "uncommon", "🐡", "Puffs up when it's excited. It's ALWAYS excited.", { kind: "sea", a: "puffer", c: 0xffe066 }],
    ["jelly", "Jellyfish", "uncommon", "🪼", "Wobbly, glowy and very gentle.", { kind: "sea", a: "jelly", c: 0xd2b8ff }],
    ["seahorse", "Seahorse", "uncommon", "🐴", "A horse that lives in the sea. Neigh-blub!", { kind: "sea", a: "seahorse", c: 0xffa8c8 }],
    ["whale", "Whale", "rare", "🐳", "The biggest squishy. Sings beautiful whale songs.", { kind: "sea", a: "whale", c: 0x5a8bd8 }],
    ["shark", "Friendly Shark", "rare", "🦈", "Only eats vegetables. Mostly seaweed salad.", { kind: "sea", a: "shark", c: 0x9fb3c8 }],
    ["narwhal", "Narwhal", "epic", "🦄", "The unicorn of the sea! Sparkly horn and everything.", { kind: "sea", a: "narwhal", c: 0xbfe6ff }],
  ] },
};
export const SERIES_IDS = Object.keys(SERIES);

// a secret chicken hides in every series 🐔
const SECRET_CHICKENS = {
  snacks: ["Donut Chicken", "Wears a donut like a swim ring. Ready for the pool. Can't swim.", { kind: "chicken", col: 0, acc: "donut" }],
  hunters: ["Pop Star Chicken", "Sings every song as BAWK. The crowd loves it.", { kind: "chicken", col: 6, acc: "idol" }],
  cluck: ["Chicken Chicken", "A chicken wearing a chicken hat. It's chickens all the way up.", { kind: "chicken", col: 2, acc: "chickenhat" }],
  spuds: ["Potato Chicken", "In a potato costume. Thinks nobody can tell. Everybody can tell.", { kind: "chicken", col: 1, acc: "potato" }],
  pets: ["Totally-a-Kitten", "Meow. (BAWK.) Meow!", { kind: "chicken", col: 9, acc: "kitty" }],
  faces: ["Spa Day Chicken", "Cucumber eyes, comfy towel. Do not disturb. BAWK.", { kind: "chicken", col: 0, acc: "spa" }],
  dinos: ["Mama Hen", "Sits on dinosaur eggs. Very confused. Very proud.", { kind: "chicken", col: 1, acc: "nest" }],
  slime: ["Slimed Chicken", "Fell into the slime pot. Loved it. Did it again.", { kind: "chicken", col: 0, acc: "slimed" }],
  ocean: ["Scuba Chicken", "Snorkel on, ready to dive. Chickens can't swim. This one is trying anyway.", { kind: "chicken", col: 5, acc: "scuba" }],
};

// special editions — same character, fancier finish (and rarer!)
const EDITIONS = [
  { id: "glitter", finish: "glitter", rarity: "rare", name: (n) => `Glitter ${n}`, note: "✨ Glitter edition", when: (i, r) => RARITY[r].order <= 1 && i % 2 === 0 },
  { id: "glow", finish: "glow", rarity: "epic", name: (n) => `Glow-in-the-Dark ${n}`, note: "🌙 Glows in the dark!", when: (i) => i % 3 === 1 },
  { id: "chrome", finish: "chrome", rarity: "legendary", name: (n) => `Chrome ${n}`, note: "🪞 So shiny you can see yourself", when: (i) => i % 4 === 2 },
  { id: "galaxy", finish: "galaxy", rarity: "mythic", name: (n) => `Galaxy ${n}`, note: "🌌 Has a whole galaxy inside", when: (i) => i % 5 === 3 },
  { id: "crystal", finish: "crystal", rarity: "secret", name: (n) => `Crystal ${n}`, note: "💎 See-through crystal", when: (i) => i === 4 },
  { id: "gold", finish: "golden", rarity: "golden", name: (n) => `Golden ${n}`, note: "🏆 Solid gold (well, gold paint)", when: (i) => i === 0 },
  { id: "rainbow", finish: "rainbow", rarity: "rainbow", name: (n) => `Ultra Rainbow ${n}`, note: "🌈 The rarest of the rare!", when: (i) => i === 11 },
];

export const CATALOG = [];
for (const [sid, S] of Object.entries(SERIES)) {
  S.chars.forEach(([cid, name, rarity, emoji, blurb, p], i) => {
    const base = { series: sid, char: cid, emoji, blurb, p, baseName: name };
    CATALOG.push({ ...base, id: `${sid}-${cid}`, name, rarity, finish: null });
    for (const E of EDITIONS) if (E.when(i, rarity)) CATALOG.push({ ...base, id: `${sid}-${cid}-${E.id}`, name: E.name(name), rarity: E.rarity, finish: E.finish, note: E.note });
  });
  const [name, blurb, p] = SECRET_CHICKENS[sid];
  CATALOG.push({ series: sid, char: "secret", emoji: "🐔", blurb, p, baseName: name, id: `${sid}-secret`, name, rarity: "secret", finish: null, note: "🤫 Secret chicken!" });
}
const BY_ID = new Map(CATALOG.map((k) => [k.id, k]));
export const byId = (id) => BY_ID.get(id);
export const isFace = (k) => k.p.kind === "face";
export const isChicken = (k) => k.p.kind === "chicken" || k.p.kind === "rubber";

// ==========================================================================
//  Materials & finishes
// ==========================================================================
let Q = 1; // detail (< 1 for shelves)
const seg = (n) => Math.max(6, Math.round(n * Q));
const mats = new Map();
function M(color, o = {}) { const k = `M${color}${JSON.stringify(o)}`; let m = mats.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.02, ...o }); mats.set(k, m); } return m; }
// "skin" — the parts a special finish paints over
function S(color, o = {}) { const k = `S${color}${JSON.stringify(o)}`; let m = mats.get(k); if (!m) { m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, metalness: 0.02, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: 0xffffff, ...o }); m.userData.skin = true; mats.set(k, m); } return m; }
const texCache = new Map();
function canvasTex(key, w, h, draw, repeat = 1) { if (texCache.has(key)) return texCache.get(key); const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4; texCache.set(key, t); return t; }
const glitterTex = () => canvasTex("glitter", 256, 256, (g, n) => { g.fillStyle = "#d8d4e0"; g.fillRect(0, 0, n, n); for (let i = 0; i < 2200; i++) { const v = rnd(0, 1); g.fillStyle = v > 0.55 ? "#ffffff" : v > 0.25 ? "#efe6ff" : "#9a90b0"; const s = rnd(1.2, 3.6); g.save(); g.translate(rnd(0, n), rnd(0, n)); g.rotate(rnd(0, 3)); g.fillRect(-s / 2, -s / 2, s, s); g.restore(); } }, 3);
const galaxyTex = () => canvasTex("galaxy", 512, 512, (g, n) => { g.fillStyle = "#1a1040"; g.fillRect(0, 0, n, n); for (const [c, k] of [["#6b2fd6", 9], ["#ff3dd6", 6], ["#2f80ed", 7], ["#00e5ff", 3]]) for (let i = 0; i < k; i++) { const x = rnd(0, n), y = rnd(0, n), r = rnd(50, 140); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c + "aa"); gr.addColorStop(1, c + "00"); g.fillStyle = gr; g.fillRect(0, 0, n, n); } for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${rnd(0.4, 1)})`; g.beginPath(); g.arc(rnd(0, n), rnd(0, n), rnd(0.4, 1.8), 0, TAU); g.fill(); } });
const rainbowTex = () => canvasTex("rainbow", 256, 256, (g, n) => { const gr = g.createLinearGradient(0, 0, n, n); ["#ff5d8f", "#ffb347", "#fff275", "#7cffb0", "#6ec6ff", "#b18cff", "#ff5d8f"].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, n, n); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${rnd(0.3, 0.9)})`; g.beginPath(); g.arc(rnd(0, n), rnd(0, n), rnd(0.5, 2), 0, TAU); g.fill(); } }, 2);
const finishes = new Map();
function finishMat(color, finish) {
  const key = `${finish}:${color}`; if (finishes.has(key)) return finishes.get(key);
  const c = new THREE.Color(color), w = new THREE.Color(0xffffff); let m;
  if (finish === "glitter") m = new THREE.MeshPhysicalMaterial({ color: c.clone().offsetHSL(0, 0.15, 0.04), map: glitterTex(), roughness: 0.28, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.35, emissive: c, emissiveIntensity: 0.1 });
  else if (finish === "glow") m = new THREE.MeshStandardMaterial({ color: c.clone().lerp(new THREE.Color(0xd9ffe0), 0.45), emissive: c.clone().lerp(new THREE.Color(0x9bffb0), 0.5), emissiveIntensity: 0.75, roughness: 0.45 });
  else if (finish === "chrome") m = new THREE.MeshPhysicalMaterial({ color: c.clone().lerp(w, 0.35), metalness: 1, roughness: 0.12, clearcoat: 1 });
  else if (finish === "galaxy") m = new THREE.MeshPhysicalMaterial({ map: galaxyTex(), color: 0xffffff, roughness: 0.25, clearcoat: 1, emissive: 0x2a1060, emissiveIntensity: 0.35 });
  else if (finish === "crystal") m = new THREE.MeshPhysicalMaterial({ color: c.clone().lerp(w, 0.55), transparent: true, opacity: 0.55, roughness: 0.04, metalness: 0.1, clearcoat: 1, iridescence: 0.7, iridescenceIOR: 1.4 });
  else if (finish === "golden") m = new THREE.MeshPhysicalMaterial({ color: 0xffc93c, metalness: 1, roughness: 0.2, clearcoat: 1, emissive: 0x6a4a00, emissiveIntensity: 0.25 });
  else if (finish === "rainbow") m = new THREE.MeshPhysicalMaterial({ map: rainbowTex(), color: 0xffffff, metalness: 0.35, roughness: 0.18, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, emissive: 0x332233, emissiveIntensity: 0.3 });
  finishes.set(key, m); return m;
}
const lum = (m) => { const c = m.color; return 0.3 * c.r + 0.59 * c.g + 0.11 * c.b; };
function applyFinish(g, finish, all = false) {
  if (!finish) return;
  g.traverse((o) => { if (!o.isMesh || !o.material || !o.material.color || o.userData.keep) return; const m = o.material; const ok = m.userData.skin || (all && lum(m) > 0.06 && !(m.emissive && m.emissive.getHex() === 0xffffff) && !m.transparent); if (ok) o.material = finishMat(m.color.getHex(), finish); });
}

// ==========================================================================
//  Little geometry helpers
// ==========================================================================
const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); return o; };
const ball = (r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = mesh(new THREE.SphereGeometry(r, seg(28), seg(18)), m, x, y, z); o.scale.set(sx, sy, sz); return o; };
const cap = (r, len, m, x = 0, y = 0, z = 0) => mesh(new THREE.CapsuleGeometry(r, len, 4, seg(14)), m, x, y, z);
const cone = (r, h, m, x = 0, y = 0, z = 0, n = 18) => mesh(new THREE.ConeGeometry(r, h, seg(n)), m, x, y, z);
const cyl = (rt, rb, h, m, x = 0, y = 0, z = 0, n = 24, open = false) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg(n), 1, open), m, x, y, z);
const cube = (w, h, d, m, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
const rbox = (w, h, d, r, m, x = 0, y = 0, z = 0) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), m, x, y, z);
const ring = (R, t, m, x = 0, y = 0, z = 0, arc = TAU) => mesh(new THREE.TorusGeometry(R, t, seg(10), seg(36), arc), m, x, y, z);
const Z = new V3(0, 0, 1);
// a point on a sphere (centre c, radius r) at yaw (left/right) and pitch (up/down)
function onBall(c, r, yaw, pitch, out = 0) { const cp = Math.cos(pitch), R = r + out; return new V3(c[0] + Math.sin(yaw) * cp * R, c[1] + Math.sin(pitch) * R, c[2] + Math.cos(yaw) * cp * R); }
// stick a part onto that sphere with its +z facing outward
function stick(g, o, c, r, yaw, pitch, out = 0) { o.position.copy(onBall(c, r, yaw, pitch, out)); const n = onBall(c, r, yaw, pitch, out + 1).sub(o.position).normalize(); o.quaternion.setFromUnitVectors(Z, n); g.add(o); return o; }
function star(r = 0.2, depth = 0.06, inner = 0.45) { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * inner : r, a = (i / 10) * TAU + Math.PI / 2; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: depth * 0.4, bevelSegments: 2 }); geo.center(); return geo; }
function heart(s = 0.2, depth = 0.06) { const sh = new THREE.Shape(); sh.moveTo(0, -s * 0.9); sh.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.7, s * 0.95, 0, s * 0.35); sh.bezierCurveTo(s * 0.7, s * 0.95, s * 1.4, -s * 0.1, 0, -s * 0.9); const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: depth * 0.4, bevelSegments: 2 }); geo.center(); return geo; }
const coneOut = (r, h, m) => { const geo = new THREE.ConeGeometry(r, h, seg(14)); geo.rotateX(Math.PI / 2); geo.translate(0, 0, h / 2); return new THREE.Mesh(geo, m); };

// ---- the kawaii face ----------------------------------------------------------
//  all sizes are distances along the surface; flat faces use a huge sphere (r = 3)
const eyeM = () => M(0x1b1020, { roughness: 0.18 }), shineM = () => M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 }), mouthM = () => M(0x6a2238, { roughness: 0.45 });
const blushM = () => M(0xff7aa8, { transparent: true, opacity: 0.5, depthWrite: false });
function kawaii(g, c, r, { size = 0.06, gap = 0.15, ey = 0.03, my = -0.09, mood = "smile", blush = true, out = 0, eyeColor = null, mouthOut = 0, mouth = true } = {}) {
  const A = (d) => d / r, parts = { eyes: [], blush: [] }; const em = eyeColor ? M(eyeColor, { roughness: 0.18 }) : eyeM();
  for (const s of [-1, 1]) {
    if (mood === "sleepy" || (mood === "wink" && s > 0) || mood === "happy") {
      const a = mesh(new THREE.TorusGeometry(size * 0.75, size * 0.2, 6, 14, Math.PI), em); stick(g, a, c, r, A(s * gap), A(ey), out); if (mood === "happy") a.rotateZ(0); else a.rotateZ(Math.PI); parts.eyes.push(a);
    } else {
      const e = mesh(new THREE.SphereGeometry(size, seg(18), seg(12)), em); e.scale.set(1, 1.2, 0.42); stick(g, e, c, r, A(s * gap), A(ey), out); parts.eyes.push(e);
      stick(g, mesh(new THREE.SphereGeometry(size * 0.34, 8, 6), shineM()), c, r, A(s * gap - size * 0.34), A(ey + size * 0.42), out + size * 0.36);
      stick(g, mesh(new THREE.SphereGeometry(size * 0.16, 6, 4), shineM()), c, r, A(s * gap + size * 0.3), A(ey - size * 0.38), out + size * 0.34);
    }
    if (mood === "grumpy") { const b = cube(size * 1.5, size * 0.28, size * 0.3, em); stick(g, b, c, r, A(s * gap), A(ey + size * 1.75), out); b.rotateZ(-s * 0.35); }
    if (blush) { const b = mesh(new THREE.CircleGeometry(size * 0.95, 16), blushM()); b.userData.keep = true; stick(g, b, c, r, A(s * (gap + size * 1.3)), A(ey - size * 1.5), out + 0.006); parts.blush.push(b); }
  }
  const mo = out + mouthOut;
  if (!mouth) return parts;
  if (mood === "open") { const m = mesh(new THREE.SphereGeometry(size * 0.6, 14, 10), mouthM()); m.scale.set(1.25, 0.95, 0.35); stick(g, m, c, r, 0, A(my), mo); }
  else if (mood === "oh") { const m = mesh(new THREE.SphereGeometry(size * 0.45, 12, 8), mouthM()); m.scale.set(0.85, 1.15, 0.35); stick(g, m, c, r, 0, A(my), mo); }
  else if (mood === "cat") { for (const s of [-1, 1]) { const m = mesh(new THREE.TorusGeometry(size * 0.38, size * 0.12, 6, 12, Math.PI), mouthM()); stick(g, m, c, r, A(s * size * 0.38), A(my), mo); m.rotateZ(Math.PI); } }
  else if (mood === "grumpy") { const m = mesh(new THREE.TorusGeometry(size * 0.5, size * 0.13, 6, 14, Math.PI), mouthM()); stick(g, m, c, r, 0, A(my - size * 0.25), mo); }
  else { const m = mesh(new THREE.TorusGeometry(size * 0.6, size * 0.15, 6, 14, Math.PI), mouthM()); stick(g, m, c, r, 0, A(my), mo); m.rotateZ(Math.PI); }
  return parts;
}

// ==========================================================================
//  Squishy Snacks
// ==========================================================================
const crumbTex = (key, base, dots) => canvasTex(key, 256, 256, (g, n) => { g.fillStyle = base; g.fillRect(0, 0, n, n); for (let i = 0; i < 900; i++) { g.fillStyle = dots[i % dots.length]; g.globalAlpha = rnd(0.2, 0.6); g.beginPath(); g.arc(rnd(0, n), rnd(0, n), rnd(0.5, 2.4), 0, TAU); g.fill(); } g.globalAlpha = 1; }, 2);
const waffleTex = () => canvasTex("waffle", 256, 256, (g, n) => { g.fillStyle = "#e3a856"; g.fillRect(0, 0, n, n); g.strokeStyle = "#b9772f"; g.lineWidth = 6; for (let i = -n; i < n * 2; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + n, n); g.stroke(); g.beginPath(); g.moveTo(i, n); g.lineTo(i + n, 0); g.stroke(); } }, 2);
const SPRINKLE = [0xff5d8f, 0xffd54a, 0x6ec6ff, 0x7cffb0, 0xffffff, 0xb18cff];
function sprinkles(g, n, place, rand) { for (let i = 0; i < n; i++) { const s = cap(0.012, 0.045, M(SPRINKLE[i % SPRINKLE.length], { roughness: 0.3 })); place(s, rand); g.add(s); } }
function buildSnack(p, g, rand) {
  const face = (c, r, o = {}) => kawaii(g, c, r, o);
  switch (p.kind) {
    case "donut": {
      const R = 0.38, t = 0.2, y = 0.6; const dough = S(0xe8b06a); const d = ring(R, t, dough, 0, y, 0); g.add(d);
      const arc = Math.PI * 1.15, ic = ring(R, t * 1.08, S(p.c), 0, y, 0.004, arc); ic.rotation.z = Math.PI / 2 - arc / 2; ic.scale.z = 1.04; g.add(ic);
      sprinkles(g, 26, (s, rr) => { const a = Math.PI / 2 + (rr() - 0.5) * arc * 0.95, b = rr() * Math.PI - Math.PI / 2, rr2 = R + Math.cos(b) * t * 1.1; s.position.set(Math.cos(a) * rr2, y + Math.sin(a) * rr2, Math.sin(b) * t * 1.12); s.rotation.set(rr() * 3, rr() * 3, rr() * 3); }, rand);
      face([0, y - R, 0], t, { size: 0.042, gap: 0.075, ey: 0.02, my: -0.05 }); return 1.2; }
    case "toast": {
      const sh = (k, dy = 0) => { const s = new THREE.Shape(); s.moveTo(-0.4 * k, dy); s.lineTo(0.4 * k, dy); s.lineTo(0.46 * k, dy + 0.62 * k); s.absellipse(0, dy + 0.62 * k, 0.5 * k, 0.32 * k, 0, Math.PI, false); s.lineTo(-0.4 * k, dy); return s; };
      const crust = new THREE.ExtrudeGeometry(sh(1), { depth: 0.26, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3, curveSegments: seg(20) }); crust.translate(0, 0.06, -0.13); g.add(mesh(crust, S(0xc98a4a)));
      const inner = new THREE.ExtrudeGeometry(sh(0.84, 0.08), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: seg(20) }); inner.translate(0, 0.06, 0.15); g.add(mesh(inner, M(0xffe3a8, { map: crumbTex("bread", "#ffe3a8", ["#f0c880", "#fff4d6"]), roughness: 0.8 })));
      g.add(rbox(0.22, 0.05, 0.14, 0.02, M(0xffe066, { roughness: 0.3 }), 0.16, 0.86, 0.21));
      face([0, 0.5, 0.21 - 3], 3, { size: 0.055, gap: 0.14, ey: 0, my: -0.09, out: 0.005 }); return 1.0; }
    case "berry": {
      const prof = [[0.001, 0], [0.16, 0.03], [0.34, 0.18], [0.43, 0.42], [0.41, 0.68], [0.28, 0.86], [0.001, 0.92]].map(([x, y]) => new THREE.Vector2(x, y));
      g.add(mesh(new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(seg(24)), seg(36)), S(0xff3d5a)));
      const seedM = M(0xffe68a, { roughness: 0.3 }); for (let i = 0; i < 46; i++) { const a = rand() * TAU, y = 0.12 + rand() * 0.66; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.75 && y > 0.3 && y < 0.62) continue; const rr = y < 0.42 ? 0.16 + (y - 0.03) * 0.72 : 0.43 - (y - 0.42) * 0.3; const s = ball(0.018, seedM, Math.sin(a) * rr, y, Math.cos(a) * rr, 0.7, 1.2, 0.7); g.add(s); }
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const l = ball(0.12, S(0x3fae4a), Math.sin(a) * 0.14, 0.92, Math.cos(a) * 0.14, 1, 0.25, 0.55); l.rotation.y = a; g.add(l); } g.add(cyl(0.025, 0.03, 0.14, M(0x2f8a3a), 0, 1.0, 0));
      face([0, 0.47, 0], 0.43, { size: 0.055, gap: 0.13, ey: 0.03, my: -0.08 }); return 1.07; }
    case "peach": {
      g.add(ball(0.45, S(0xffae8a), 0, 0.45, 0, 1.02, 0.96, 0.95)); g.add(ball(0.3, M(0xff7a8a, { transparent: true, opacity: 0.35, depthWrite: false }), 0.18, 0.5, 0.25, 1, 1, 0.6));
      const groove = ring(0.44, 0.012, M(0xe8806a), 0, 0.46, 0, Math.PI * 0.6); groove.rotation.set(0, Math.PI / 2 - 0.5, Math.PI / 2 - 0.2); g.add(groove);
      for (const s of [-1, 1]) { const l = ball(0.13, S(0x5cbf5a), s * 0.1, 0.9, 0, 1, 0.22, 0.55); l.rotation.z = s * 0.5; g.add(l); } g.add(cyl(0.02, 0.025, 0.1, M(0x7a4a2a), 0, 0.9, 0));
      face([0, 0.42, 0], 0.44, { size: 0.055, gap: 0.13, ey: 0.03, my: -0.08 }); return 0.95; }
    case "cupcake": {
      const geo = new THREE.CylinderGeometry(0.4, 0.3, 0.42, seg(40), 1); const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), a = Math.atan2(z, x), k = 1 + 0.05 * Math.cos(a * 20); pa.setX(i, x * k); pa.setZ(i, z * k); } geo.computeVertexNormals();
      g.add(mesh(geo, S(0x7ad3ff), 0, 0.21, 0));
      [[0.42, 0.48, 0.13], [0.33, 0.64, 0.12], [0.22, 0.78, 0.1]].forEach(([R, y, t]) => g.add(ring(R - t * 0.4, t, S(p.c), 0, y, 0).rotateX(Math.PI / 2)));
      g.add(ball(0.15, S(p.c), 0, 0.86, 0)); g.add(ball(0.08, M(0xe8203a, { roughness: 0.15 }), 0, 1.0, 0)); g.add(cyl(0.008, 0.008, 0.12, M(0x3a7a2a), 0.02, 1.1, 0));
      sprinkles(g, 18, (s, rr) => { const a = rr() * TAU, R = 0.2 + rr() * 0.2; s.position.set(Math.cos(a) * R, 0.55 + (0.42 - R) * 0.9 + 0.08, Math.sin(a) * R); s.rotation.set(rr() * 3, rr() * 3, rr() * 3); }, rand);
      face([0, 0.2, 0], 0.37, { size: 0.05, gap: 0.12, ey: 0.03, my: -0.07 }); return 1.12; }
    case "boba": {
      g.add(cyl(0.3, 0.25, 0.78, S(0xe8c49a), 0, 0.39, 0)); g.add(cyl(0.31, 0.26, 0.04, M(0xffffff), 0, 0.02, 0));
      const lid = ball(0.31, M(0xffffff, { transparent: true, opacity: 0.6, roughness: 0.05 }), 0, 0.78, 0, 1, 0.45, 1); g.add(lid); g.add(ring(0.31, 0.025, M(0xffffff), 0, 0.78, 0).rotateX(Math.PI / 2));
      const straw = cyl(0.045, 0.045, 0.7, M(0xff5d8f, { roughness: 0.3 }), 0.08, 1.05, 0); straw.rotation.z = -0.25; g.add(straw);
      const pearl = M(0x2a1810, { roughness: 0.15 }); for (let i = 0; i < 14; i++) { const a = -1.1 + (i % 7) * 0.37, y = 0.08 + Math.floor(i / 7) * 0.09; g.add(ball(0.05, pearl, Math.sin(a) * 0.27, y, Math.cos(a) * 0.27)); }
      face([0, 0.45, 0], 0.28, { size: 0.05, gap: 0.1, ey: 0.03, my: -0.06 }); return 1.3; }
    case "icecream": {
      const cn = cone(0.27, 0.62, M(0xffffff, { map: waffleTex(), roughness: 0.7 }), 0, 0.31, 0); cn.rotation.x = Math.PI; g.add(cn);
      g.add(ball(0.33, S(0xffa8c8), 0, 0.78, 0)); g.add(ball(0.27, S(0x9ff0c8), 0, 1.18, 0));
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; g.add(ball(0.045, S(0xffa8c8), Math.sin(a) * 0.29, 0.62 - (i % 2) * 0.05, Math.cos(a) * 0.29, 1, 1.6, 1)); }
      g.add(ball(0.07, M(0xe8203a, { roughness: 0.15 }), 0, 1.47, 0));
      face([0, 0.76, 0], 0.33, { size: 0.05, gap: 0.12, ey: 0.03, my: -0.08 }); return 1.55; }
    case "croissant": {
      const m = S(0xe8a84c), dark = S(0xc77a2a);
      for (let i = -3; i <= 3; i++) { const a = i * 0.38, k = 1 - Math.abs(i) / 4.2; const o = ball(0.3 * k + 0.04, i % 2 ? dark : m, Math.sin(a) * 0.55, 0.26 * k + 0.05, -Math.cos(a) * 0.55 + 0.55, 0.62, 1, 1); o.rotation.y = -a; g.add(o); }
      face([0, 0.3, 0.06], 0.33, { size: 0.045, gap: 0.1, ey: 0.03, my: -0.07 }); return 0.65; }
    case "melon": {
      const R = 0.85, cy = 0.95, a0 = -Math.PI / 2 - 0.85, a1 = -Math.PI / 2 + 0.85;
      const wedge = (r, extra = 0) => { const s = new THREE.Shape(); s.moveTo(0, cy); s.lineTo(Math.cos(a0) * r, cy + Math.sin(a0) * r); s.absarc(0, cy, r, a0, a1, false); s.lineTo(0, cy); return new THREE.ExtrudeGeometry(s, { depth: 0.22 + extra, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: seg(24) }); };
      const red = wedge(R * 0.86); red.translate(0, 0, -0.11); g.add(mesh(red, S(0xff4f6a))); const white = wedge(R * 0.92, -0.02); white.translate(0, 0, -0.1); g.add(mesh(white, M(0xf6ffe8))); const green = wedge(R, -0.04); green.translate(0, 0, -0.09); g.add(mesh(green, M(0x2f9a4a)));
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.2, r = 0.42 + (i % 2) * 0.16; const s = ball(0.025, M(0x2a1810, { roughness: 0.2 }), Math.cos(a) * r, cy + Math.sin(a) * r, 0.16, 0.7, 1.2, 0.5); s.rotation.z = a + Math.PI / 2; g.add(s); }
      face([0, 0.68, 0.16 - 3], 3, { size: 0.05, gap: 0.12, ey: 0, my: -0.08, out: 0.005 }); return 0.95; }
    case "taco": {
      const R = 0.52; const shell = mesh(new THREE.SphereGeometry(R, seg(36), seg(18), 0, TAU, Math.PI / 2, Math.PI / 2), S(0xf2c063, { side: THREE.DoubleSide }), 0, R, 0); shell.scale.z = 0.36; g.add(shell);
      for (let i = 0; i < 9; i++) { const x = -0.42 + i * 0.105; g.add(ball(0.09, M(0x5ccf4a, { roughness: 0.6 }), x, R + 0.03 + Math.sin(i * 1.7) * 0.02, 0, 1, 0.8, 1.2)); if (i % 2) g.add(ball(0.06, M(0xe8303a), x, R + 0.09, 0.03)); if (i % 3 === 1) g.add(ball(0.05, M(0xffd23a), x + 0.04, R + 0.1, -0.03)); }
      face([0, R * 0.55, R * 0.36 - 3], 3, { size: 0.05, gap: 0.12, ey: 0, my: -0.08, out: 0.002 }); return R + 0.15; }
    case "avocado": {
      const pear = (k) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.55 * k, 0, 0.55 * k, 0.55 * k, 0.32 * k, 0.78 * k); s.bezierCurveTo(0.2 * k, 0.95 * k, 0.2 * k, 1.1 * k, 0, 1.12 * k); s.bezierCurveTo(-0.2 * k, 1.1 * k, -0.2 * k, 0.95 * k, -0.32 * k, 0.78 * k); s.bezierCurveTo(-0.55 * k, 0.55 * k, -0.55 * k, 0, 0, 0); return s; };
      const skin = new THREE.ExtrudeGeometry(pear(1), { depth: 0.24, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3, curveSegments: seg(18) }); skin.translate(0, 0.02, -0.12); g.add(mesh(skin, S(0x3f7a2a)));
      const flesh = new THREE.ExtrudeGeometry(pear(0.86), { depth: 0.03, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: seg(18) }); flesh.translate(0, 0.1, 0.17); g.add(mesh(flesh, M(0xd6ec8a, { roughness: 0.4 })));
      g.add(ball(0.17, M(0x8a5230, { roughness: 0.3 }), 0, 0.36, 0.2, 1, 1, 0.55));
      face([0, 0.75, 0.21 - 3], 3, { size: 0.045, gap: 0.1, ey: 0, my: -0.07, out: 0.005 }); return 1.18; }
    case "cloud": default: {
      const m = S(0xeef6ff); [[0, 0.45, 0, 0.38], [-0.38, 0.36, -0.02, 0.27], [0.38, 0.36, -0.02, 0.27], [-0.18, 0.72, -0.06, 0.26], [0.2, 0.74, -0.06, 0.25], [0, 0.82, -0.12, 0.22]].forEach(([x, y, z, r]) => g.add(ball(r, m, x, y, z)));
      const cols = [0xff5d8f, 0xffd54a, 0x6ec6ff]; cols.forEach((c, i) => { const a = ring(0.62 - i * 0.07, 0.035, M(c, { roughness: 0.4 }), 0, 0.4, -0.25, Math.PI); g.add(a); });
      for (let i = 0; i < 5; i++) { const d = ball(0.03, M(SPRINKLE[i]), -0.3 + i * 0.15, 0.04 + (i % 2) * 0.05, 0.1, 0.6, 1.3, 0.6); g.add(d); }
      face([0, 0.45, 0], 0.38, { size: 0.055, gap: 0.13, ey: 0.03, my: -0.08 }); return 1.05; }
  }
}

// ==========================================================================
//  Pop Star Spirit Hunters
// ==========================================================================
const grilleTex = () => canvasTex("grille", 128, 128, (g, n) => { g.fillStyle = "#c8ccd8"; g.fillRect(0, 0, n, n); g.fillStyle = "#6a6e7a"; for (let y = 4; y < n; y += 8) for (let x = 4 + ((y / 8) % 2) * 4; x < n; x += 8) { g.beginPath(); g.arc(x, y, 2, 0, TAU); g.fill(); } }, 3);
const glowM = (c, i = 1.3) => M(c, { emissive: c, emissiveIntensity: i, roughness: 0.3 });
function buildHunter(p, g, rand) {
  switch (p.kind) {
    case "ghost": {
      const geo = new THREE.SphereGeometry(0.4, seg(36), seg(26)); const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) { let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); if (y < 0) { const k = -y / 0.4, th = Math.atan2(z, x), f = 1 + k * 0.18; y = y * 1.55 + k * k * k * 0.07 * Math.sin(th * 6); x *= f; z *= f; } pa.setXYZ(i, x, y, z); } geo.computeVertexNormals();
      g.add(mesh(geo, S(p.c, { roughness: 0.3, clearcoat: 0.8 }), 0, 0.7, 0));
      for (const s of [-1, 1]) g.add(ball(0.1, S(p.c), s * 0.42, 0.62, 0.05, 0.7, 1, 0.7));
      kawaii(g, [0, 0.72, 0], 0.4, { size: 0.06, gap: 0.13, ey: 0.04, my: -0.08, mood: p.mood });
      if (p.mood === "wink") { const drop = ball(0.04, M(0x8fd8ff, { transparent: true, opacity: 0.8 }), 0.05, 0.6, 0.4, 1, 1.3, 0.6); g.add(drop); }
      return 1.12; }
    case "mic": {
      g.add(cyl(0.26, 0.3, 0.06, M(0x2a2a40, { metalness: 0.6, roughness: 0.3 }), 0, 0.03, 0)); g.add(cyl(0.025, 0.025, 0.55, M(0x9aa0b0, { metalness: 0.9, roughness: 0.2 }), 0, 0.33, 0));
      g.add(cyl(0.09, 0.06, 0.32, S(0xff5da2, { metalness: 0.4 }), 0, 0.74, 0)); g.add(ring(0.095, 0.03, glowM(0x7cfff0), 0, 0.88, 0).rotateX(Math.PI / 2));
      g.add(ball(0.24, M(0xffffff, { map: grilleTex(), metalness: 0.7, roughness: 0.3 }), 0, 1.1, 0));
      kawaii(g, [0, 1.1, 0], 0.24, { size: 0.045, gap: 0.08, ey: 0.02, my: -0.05, out: 0.004 });
      for (let i = 0; i < 3; i++) { const st = mesh(star(0.06, 0.02), glowM(0xffe066, 0.8)); st.position.set(-0.32 + i * 0.32, 1.42 + (i % 2) * 0.08, -0.05); g.add(st); }
      return 1.5; }
    case "sword": {
      const rock = ball(0.38, S(0xb8a8d8, { roughness: 0.8 }), 0, 0.22, 0, 1.05, 0.62, 0.82); g.add(rock);
      g.add(cube(0.1, 0.62, 0.03, glowM(0xff8ad8, 1.1), 0, 0.72, 0)); g.add(cone(0.05, 0.12, glowM(0xff8ad8, 1.1), 0, 1.09, 0, 4).rotateY(Math.PI / 4));
      g.add(rbox(0.36, 0.06, 0.09, 0.02, M(0xffc93c, { metalness: 0.8, roughness: 0.25 }), 0, 0.42 + 0.18, 0));
      kawaii(g, [0, 0.22, 0], 0.31, { size: 0.045, gap: 0.1, ey: 0.0, my: -0.06 });
      return 1.15; }
    case "lightstick": {
      g.add(cyl(0.07, 0.085, 0.55, M(0x2a2a40, { roughness: 0.4 }), 0, 0.28, 0)); g.add(ring(0.08, 0.02, M(0xffffff), 0, 0.5, 0).rotateX(Math.PI / 2));
      const h = mesh(heart(0.25, 0.12), glowM(p.c, 0.85)); h.position.set(0, 0.83, 0); g.add(h);
      kawaii(g, [0, 0.85, 0.11 - 3], 3, { size: 0.045, gap: 0.09, ey: 0, my: -0.06, out: 0.005 });
      return 1.12; }
    case "idol": default: return idol(p, g);
  }
}
function idol(p, g) {
  const skin = M(p.skin || 0xffdcc4, { roughness: 0.6 }), hair = S(p.hair), outfit = S(p.outfit), acc = M(p.accent, { roughness: 0.35 });
  for (const s of [-1, 1]) { g.add(cap(0.055, 0.14, skin, s * 0.07, 0.14, 0)); g.add(rbox(0.1, 0.07, 0.15, 0.03, acc, s * 0.07, 0.035, 0.02)); }
  g.add(cyl(0.11, 0.22, 0.26, outfit, 0, 0.36, 0)); g.add(cap(0.12, 0.08, outfit, 0, 0.52, 0)); g.add(ring(0.165, 0.02, acc, 0, 0.42, 0).rotateX(Math.PI / 2));
  const st = mesh(star(0.05, 0.015), glowM(p.accent, 0.5)); st.position.set(0, 0.55, 0.13); g.add(st);
  for (const s of [-1, 1]) { const a = cap(0.04, 0.2, skin, s * 0.17, 0.48, 0.02); a.rotation.z = s * 0.35; if (s > 0) { a.rotation.z = -0.2; a.rotation.x = -0.7; a.position.set(0.17, 0.5, 0.08); } g.add(a); }
  const hc = [0, 0.86, 0], hr = 0.3; g.add(ball(hr, skin, ...hc, 1.02, 0.98, 0.98));
  kawaii(g, hc, hr, { size: 0.07, gap: 0.12, ey: -0.01, my: -0.12, eyeColor: new THREE.Color(p.hair).lerp(new THREE.Color(0x111122), 0.6).getHex() });
  g.add(ball(hr * 1.06, hair, 0, 0.9, -0.04, 1.02, 0.95, 1.0)); // hair cap behind the face
  for (let i = -2; i <= 2; i++) { const b = ball(0.09, hair); stick(g, b, hc, hr, i * 0.3, 0.72, -0.02); b.scale.set(1.2, 0.8, 0.6); }
  if (p.style === "long") { g.add(rbox(0.56, 0.5, 0.2, 0.08, hair, 0, 0.66, -0.16)); for (const s of [-1, 1]) g.add(cap(0.07, 0.36, hair, s * 0.27, 0.68, 0.0)); }
  if (p.style === "bob") { for (const s of [-1, 1]) g.add(ball(0.15, hair, s * 0.25, 0.78, -0.02, 0.8, 1.2, 1)); g.add(ball(0.26, hair, 0, 0.78, -0.12, 1.2, 0.9, 0.8)); }
  if (p.style === "buns") for (const s of [-1, 1]) { g.add(ball(0.12, hair, s * 0.22, 1.14, -0.04)); g.add(ring(0.08, 0.02, acc, s * 0.2, 1.08, -0.02).rotateX(1.2)); }
  if (p.style === "ponytail") { const t = cap(0.08, 0.36, hair, 0, 0.82, -0.38); t.rotation.x = 0.5; g.add(t); g.add(ring(0.07, 0.025, acc, 0, 1.0, -0.3).rotateX(1.0)); }
  if (p.style === "short") { for (let i = 0; i < 5; i++) { const sp = coneOut(0.06, 0.14, hair); stick(g, sp, [0, 0.9, -0.04], hr * 1.04, -0.6 + i * 0.3, 1.0, -0.03); } }
  const clip = mesh(star(0.05, 0.02), glowM(p.accent, 0.6)); stick(g, clip, hc, hr * 1.05, 0.55, 0.55, 0.02);
  // the prop in her (right) hand
  const hx = 0.2, hy = 0.42, hz = 0.2;
  if (p.prop === "sword") { const b = cube(0.05, 0.55, 0.02, glowM(0xff8ad8, 1.2), hx, hy + 0.3, hz); g.add(b, cube(0.16, 0.035, 0.05, M(0xffc93c, { metalness: 0.8, roughness: 0.25 }), hx, hy + 0.02, hz)); }
  if (p.prop === "mic") { g.add(cyl(0.025, 0.02, 0.16, M(0x222222), hx, hy + 0.04, hz)); g.add(ball(0.05, M(0xffffff, { map: grilleTex(), metalness: 0.7, roughness: 0.3 }), hx, hy + 0.15, hz)); }
  if (p.prop === "fan") { const f = mesh(new THREE.CircleGeometry(0.17, seg(16), 0, Math.PI), M(p.accent, { side: THREE.DoubleSide, roughness: 0.4 })); f.position.set(hx, hy + 0.05, hz); f.rotation.y = -0.4; g.add(f); }
  if (p.prop === "sticks") for (const s of [-1, 1]) { const st2 = cyl(0.012, 0.012, 0.3, M(0xf2d6a0), hx + s * 0.03, hy + 0.1, hz); st2.rotation.z = s * 0.3; g.add(st2); }
  if (p.prop === "wand") { g.add(cyl(0.012, 0.012, 0.3, M(0xffffff), hx, hy + 0.1, hz)); const w = mesh(star(0.07, 0.02), glowM(0xffe066, 0.9)); w.position.set(hx, hy + 0.28, hz); g.add(w); }
  return 1.2;
}

// ==========================================================================
//  Cluck Club (and the secret chickens)
// ==========================================================================
function buildChicken(p, g, rand) {
  if (p.kind === "rubber") return rubberChicken(g);
  const col = p.chick ? CHICKEN_COLORS[9] : CHICKEN_COLORS[p.col || 0]; const ch = makeChicken({ color: col, chick: !!p.chick }); const s = p.chick ? 2.6 : 1.85; ch.group.scale.setScalar(s); g.add(ch.group); g.userData.chicken = ch;
  const H = ch.head, A = (o, x, y, z) => { if (x !== undefined) o.position.set(x, y, z); H.add(o); return o; }; // head-local: radius ≈ 0.11, comb on top, beak at +z
  const black = M(0x1a1a22, { roughness: 0.35 }), red = M(0xe53935, { roughness: 0.45 }), white = M(0xffffff, { roughness: 0.6 }), gold = M(0xffc93c, { metalness: 0.9, roughness: 0.2 });
  const shades = (c = black) => { for (const sx of [-1, 1]) A(rbox(0.06, 0.04, 0.02, 0.01, c, sx * 0.045, 0.035, 0.105)); A(cube(0.04, 0.008, 0.01, c, 0, 0.045, 0.11)); };
  switch (p.acc) {
    case "pirate": A(cyl(0.16, 0.16, 0.02, black, 0, 0.12, 0)); A(ball(0.09, black, 0, 0.14, 0, 1, 0.8, 1)); A(mesh(new THREE.CircleGeometry(0.025, 12), white, 0, 0.16, 0.085)); A(cyl(0.022, 0.022, 0.01, black, 0.075, 0.035, 0.07)).rotation.set(Math.PI / 2, 0, 0.8); break;
    case "chef": A(cyl(0.075, 0.07, 0.11, white, 0, 0.17, 0)); A(ball(0.1, white, 0, 0.26, 0, 1, 0.7, 1)); break;
    case "disco": [0xff5d8f, 0xffd54a, 0x6ec6ff, 0x7cffb0, 0xb18cff, 0xff8a3d, 0xff5d8f, 0x6ec6ff, 0xffd54a, 0x7cffb0].forEach((c, i) => { const a = (i / 10) * TAU; A(ball(0.065, M(c, { roughness: 0.6 }), Math.cos(a) * 0.09, 0.13 + Math.sin(i * 2.3) * 0.02, Math.sin(a) * 0.09 - 0.02)); }); A(ball(0.07, M(0xff3dd6), 0, 0.17, 0)); shades(M(0xff3dd6, { metalness: 0.6, roughness: 0.2 })); break;
    case "astro": { const helm = ball(0.19, M(0xcfefff, { transparent: true, opacity: 0.3, roughness: 0.02, depthWrite: false }), 0, 0.02, 0.02); helm.userData.keep = true; A(helm); g.add(ring(0.13, 0.04, white, 0, 0.5 * s, 0.13 * s).rotateX(Math.PI / 2 - 0.3)); A(cyl(0.006, 0.006, 0.12, M(0x888888), 0.08, 0.2, 0)); A(ball(0.02, red, 0.08, 0.27, 0)); break; }
    case "wizard": { A(cyl(0.15, 0.15, 0.015, M(0x4a2a9a), 0, 0.1, 0)); A(cone(0.1, 0.28, M(0x4a2a9a), 0, 0.24, 0)).rotation.z = 0.25; for (let i = 0; i < 3; i++) { const st = mesh(star(0.022, 0.008), gold); A(st, -0.03 + i * 0.03, 0.17 + i * 0.05, 0.07 - i * 0.02); } break; }
    case "crown": { A(cyl(0.07, 0.065, 0.06, gold, 0, 0.16, 0, 16, true)); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; A(cone(0.018, 0.05, gold, Math.cos(a) * 0.068, 0.21, Math.sin(a) * 0.068)); A(ball(0.012, M(0xff3d9a, { roughness: 0.1 }), Math.cos(a) * 0.07, 0.17, Math.sin(a) * 0.07)); } break; }
    case "ninja": { A(ring(0.112, 0.02, red, 0, 0.04, 0).rotateX(Math.PI / 2)); for (const sx of [-1, 1]) { const t = cube(0.015, 0.1, 0.03, red, sx * 0.02, 0.0, -0.13); t.rotation.x = 0.6; t.rotation.z = sx * 0.3; A(t); } break; }
    case "cape": { const c = mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.5, seg(16), 1, true, Math.PI * 0.6, Math.PI * 0.8), M(0xe53935, { side: THREE.DoubleSide, roughness: 0.5 })); c.position.set(0, 0.4 * s - 0.02, -0.1 * s); c.rotation.y = 0; g.add(c); const em = mesh(star(0.09, 0.02), gold); em.position.set(0, 0.36 * s, 0.32 * s); g.add(em); A(cube(0.11, 0.025, 0.02, M(0x3d8bfd), 0, 0.035, 0.1)); break; }
    case "nugget": { const geo = new THREE.SphereGeometry(0.3, seg(28), seg(18)); const pa = geo.attributes.position; const r2 = rng(7); const bumps = Array.from({ length: 9 }, () => [r2() * TAU, r2() * 3, r2() * 0.04 + 0.02]); for (let i = 0; i < pa.count; i++) { const v = new V3(pa.getX(i), pa.getY(i), pa.getZ(i)); const th = Math.atan2(v.z, v.x), ph = Math.acos(Math.max(-1, Math.min(1, v.y / 0.3))); let k = 1; for (const [a, b, h] of bumps) k += h * Math.sin(th * 3 + a) * Math.sin(ph * 2 + b); v.multiplyScalar(k); pa.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); const n = mesh(geo, S(0xd99a3f, { map: crumbTex("nug", "#e0a54a", ["#b8742a", "#f2c87a"]), roughness: 0.8 }), 0, 0.34 * s, 0.02 * s); n.scale.set(s * 0.95, s * 0.82, s * 1.1); g.add(n); break; }
    case "donut": { const d = ring(0.26, 0.11, S(0xe8b06a), 0, 0.33 * s, 0); d.rotation.x = Math.PI / 2; d.scale.setScalar(s); g.add(d); const ic = ring(0.26, 0.115, S(0xff8ac8), 0, 0.345 * s, 0, Math.PI * 2); ic.rotation.x = Math.PI / 2; ic.scale.set(s, s, s * 0.55); g.add(ic); break; }
    case "idol": { shades(M(0xff5da2, { metalness: 0.5, roughness: 0.2 })); const st = mesh(star(0.03, 0.01), M(0xffe066, { emissive: 0xffe066, emissiveIntensity: 0.6 })); A(st, 0.06, 0.13, 0.04); g.add(cyl(0.02, 0.015, 0.14, M(0x222222), 0.26, 0.42 * s, 0.2)); g.add(ball(0.05, M(0xffffff, { map: grilleTex(), metalness: 0.7 }), 0.26, 0.42 * s + 0.1, 0.2)); break; }
    case "chickenhat": { const mini = makeChicken({ color: CHICKEN_COLORS[0] }); mini.group.scale.setScalar(0.42); mini.group.position.set(0, 0.08, -0.04); H.add(mini.group); break; }
    case "potato": { const geo = lumpy(0.3, 11); const n = mesh(geo, S(0xc8935a, { map: spudTex(), roughness: 0.8 }), 0, 0.34 * s, 0.02 * s); n.scale.set(s * 0.95, s * 0.85, s * 1.1); g.add(n); break; }
    case "kitty": { for (const sx of [-1, 1]) { const e = coneOut(0.04, 0.08, M(0xffe066)); e.position.set(sx * 0.06, 0.1, -0.01); e.quaternion.setFromUnitVectors(Z, new V3(sx * 0.4, 1, 0).normalize()); H.add(e); for (const k of [-1, 1]) { const w = cyl(0.003, 0.003, 0.12, black); w.rotation.z = Math.PI / 2 + k * 0.15; A(w, sx * 0.09, -0.01 + k * 0.012, 0.09); } } const tail = cap(0.025, 0.25, M(0xffe066), 0, 0.35, -0.42); tail.rotation.x = -0.6; g.add(tail); break; }
    case "nest": { const nest = ring(0.32, 0.1, M(0x9a6a3a, { roughness: 1 }), 0, 0.07, 0); nest.rotation.x = Math.PI / 2; g.add(nest); for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; g.add(ball(0.09, M(i === 1 ? 0x9ff0c8 : 0xfff3dc, { roughness: 0.5 }), Math.cos(a) * 0.3, 0.12, Math.sin(a) * 0.3, 0.85, 1.15, 0.85)); } break; }
    case "slimed": { const gm = M(0x7cff6a, { roughness: 0.08, transparent: true, opacity: 0.85 }); A(ball(0.09, gm, 0, 0.1, 0, 1.4, 0.55, 1.4)); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; A(cap(0.018, 0.05 + (i % 2) * 0.04, gm, Math.cos(a) * 0.1, 0.05 - (i % 2) * 0.02, Math.sin(a) * 0.1)); } g.add(ball(0.16, gm, 0.05, 0.5 * s, -0.1 * s, 1.4, 0.5, 1.2)); break; }
    case "scuba": { A(rbox(0.17, 0.07, 0.04, 0.02, M(0x3db8ff, { transparent: true, opacity: 0.55, roughness: 0.05 }), 0, 0.035, 0.1)); A(ring(0.115, 0.012, M(0x222244), 0, 0.035, 0)).rotation.x = Math.PI / 2; A(cyl(0.012, 0.012, 0.2, M(0xffd23a), 0.11, 0.08, 0.02)); A(ball(0.02, M(0xff5d8f), 0.11, 0.19, 0.02)); break; }
    case "spa": { const cuc = M(0x9fe07a, { roughness: 0.4 }); for (const sx of [-1, 1]) { const c = cyl(0.04, 0.04, 0.012, cuc, sx * 0.075, 0.03, 0.065); c.rotation.set(Math.PI / 2, 0, 0); c.rotation.y = sx * 0.9; A(c); } A(ball(0.13, M(0xffd1e8, { roughness: 0.9 }), 0, 0.08, -0.03, 1, 0.75, 1)); A(ball(0.06, M(0xffd1e8, { roughness: 0.9 }), 0, 0.17, 0.03)); break; }
  }
  return (p.chick ? 0.68 : 0.78) * s * 0.85 + (["chef", "wizard", "chickenhat"].includes(p.acc) ? 0.35 : 0.1);
}
function rubberChicken(g) {
  const y = M(0xffe680, { roughness: 0.35 }), yS = S(0xffe680, { roughness: 0.35, clearcoat: 1 }), or = M(0xff9a1f, { roughness: 0.3 }), red = M(0xe53935, { roughness: 0.4 });
  for (const s of [-1, 1]) { g.add(cyl(0.022, 0.022, 0.42, or, s * 0.09, 0.22, 0)); for (const a of [-0.5, 0, 0.5]) { const t = cyl(0.013, 0.013, 0.12, or, s * 0.09 + Math.sin(a) * 0.05, 0.015, Math.cos(a) * 0.05); t.rotation.x = Math.PI / 2; t.rotation.y = a; g.add(t); } }
  g.add(cap(0.2, 0.18, yS, 0, 0.6, 0)); for (const s of [-1, 1]) { const w = ball(0.1, yS, s * 0.2, 0.62, 0, 0.35, 1, 0.8); w.rotation.z = s * 0.4; g.add(w); }
  const neck = cap(0.06, 0.4, yS, 0, 1.0, 0.03); neck.rotation.x = 0.15; g.add(neck);
  const hc = [0, 1.3, 0.08]; g.add(ball(0.12, yS, ...hc)); for (let i = 0; i < 3; i++) g.add(ball(0.045, red, 0, 1.43 + (i === 1 ? 0.02 : 0), 0.03 + i * 0.05, 0.6, 1, 1));
  const b1 = coneOut(0.04, 0.14, or); b1.position.set(0, 1.29, 0.17); b1.rotation.x = -0.25; g.add(b1); const b2 = coneOut(0.035, 0.12, or); b2.position.set(0, 1.25, 0.17); b2.rotation.x = 0.35; g.add(b2);
  kawaii(g, hc, 0.12, { size: 0.03, gap: 0.06, ey: 0.03, my: -0.03, mood: "oh", blush: true, mouthOut: 0.2 });
  return 1.5;
}

// ==========================================================================
//  Silly Spuds
// ==========================================================================
const spudTex = () => canvasTex("spud", 256, 256, (g, n) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, n, n); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(110,70,30,${rnd(0.15, 0.4)})`; g.beginPath(); g.ellipse(rnd(0, n), rnd(0, n), rnd(2, 6), rnd(1.5, 4), rnd(0, 3), 0, TAU); g.fill(); } for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(120,80,40,${rnd(0.04, 0.12)})`; g.fillRect(rnd(0, n), rnd(0, n), 2, 2); } }, 2);
function lumpy(r, seed) { const geo = new THREE.SphereGeometry(r, seg(32), seg(22)); const pa = geo.attributes.position; const R = rng(seed); const a = [R() * 6, R() * 6, R() * 6]; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const k = 1 + 0.06 * Math.sin(x * 9 + a[0]) * Math.cos(y * 7 + a[1]) + 0.04 * Math.sin(z * 11 + a[2]); pa.setXYZ(i, x * k, y * k, z * k); } geo.computeVertexNormals(); return geo; }
function buildSpud(p, g, rand, id) {
  const black = M(0x1a1a22, { roughness: 0.3 }), white = M(0xffffff, { roughness: 0.5 }), gold = M(0xffc93c, { metalness: 0.9, roughness: 0.2 });
  if (p.kind === "fries") {
    const box = cyl(0.36, 0.27, 0.62, S(0xe53935, { roughness: 0.35 }), 0, 0.31, 0, 4); box.rotation.y = Math.PI / 4; g.add(box);
    for (let i = 0; i < 11; i++) { const f = cube(0.07, 0.42, 0.07, M(0xffd23a, { roughness: 0.6 }), -0.2 + (i % 6) * 0.08, 0.72 + rand() * 0.12, -0.08 + Math.floor(i / 6) * 0.13); f.rotation.z = (rand() - 0.5) * 0.4; f.rotation.x = (rand() - 0.5) * 0.3; g.add(f); }
    kawaii(g, [0, 0.3, 0.225 - 3], 3, { size: 0.05, gap: 0.11, ey: 0.02, my: -0.07, out: 0.012 }); return 1.0;
  }
  if (p.kind === "mashed") {
    g.add(ball(0.5, S(0xfff0c4, { roughness: 0.6 }), 0, 0.2, 0, 1, 0.45, 0.9)); g.add(ball(0.3, S(0xfff0c4, { roughness: 0.6 }), 0, 0.36, -0.02, 1, 0.6, 1));
    const b = rbox(0.2, 0.07, 0.16, 0.02, M(0xffe24a, { roughness: 0.3 }), 0.03, 0.55, 0); b.rotation.z = 0.15; g.add(b);
    kawaii(g, [0, 0.24, 0], 0.44, { size: 0.05, gap: 0.12, ey: 0.03, my: -0.07, mood: "happy" }); return 0.62;
  }
  const small = p.small, k = small ? 0.72 : 1; let baseY = 0.45 * k;
  if (p.acc === "couch") { const red = M(0xd9435a, { roughness: 0.8 }); g.add(rbox(1.0, 0.24, 0.55, 0.06, red, 0, 0.12, 0), rbox(1.0, 0.5, 0.16, 0.06, red, 0, 0.4, -0.22), rbox(0.16, 0.36, 0.55, 0.06, red, -0.47, 0.3, 0), rbox(0.16, 0.36, 0.55, 0.06, red, 0.47, 0.3, 0)); baseY = 0.6; }
  const body = mesh(lumpy(0.42 * k, hash(id)), S(p.c || 0xc8935a, { map: spudTex(), roughness: 0.75 }), 0, baseY, 0); body.scale.set(0.9, 1.05, 0.8); g.add(body);
  const hc = [0, baseY + 0.02 * k, 0], hr = 0.36 * k, f = (o) => kawaii(g, hc, hr, { size: 0.055 * k, gap: 0.12 * k, ey: 0.06 * k, my: -0.08 * k, ...o });
  const top = baseY + 0.44 * k;
  switch (p.acc) {
    case "mustache": f({ mood: "smile" }); for (const s of [-1, 1]) { const m = ring(0.06, 0.028, black, 0, 0, 0, Math.PI * 1.2); stick(g, m, hc, hr, s * 0.14, -0.05, 0.01); m.rotateZ(s > 0 ? Math.PI * 0.95 : -0.15 * Math.PI); } break;
    case "shades": f({ mood: "smile" }); for (const s of [-1, 1]) { const l = rbox(0.15, 0.1, 0.03, 0.02, black, 0, 0, 0); stick(g, l, hc, hr, s * 0.32, 0.17, 0.02); } { const br = cube(0.08, 0.02, 0.02, black); stick(g, br, hc, hr, 0, 0.18, 0.025); } break;
    case "bow": f({ mood: "smile", size: 0.065 }); { const pink = M(0xff7ab8, { roughness: 0.4 }); for (const s of [-1, 1]) { const c = coneOut(0.07, 0.12, pink); c.position.set(s * 0.02, top, 0); c.quaternion.setFromUnitVectors(Z, new V3(s, 0.3, 0).normalize()); g.add(c); } g.add(ball(0.035, pink, 0, top, 0)); } break;
    case "couch": f({ mood: "sleepy" }); g.add(rbox(0.06, 0.03, 0.14, 0.01, black, 0.34, 0.27, 0.12)); break;
    case "party": f({ mood: "open" }); { const h = cone(0.13, 0.32, M(0x7a3cff, { roughness: 0.4 }), 0.05, top + 0.12, 0); h.rotation.z = -0.2; g.add(h); g.add(ball(0.05, M(0xffd54a), 0.08, top + 0.29, 0)); for (let i = 0; i < 10; i++) g.add(cube(0.04, 0.04, 0.005, M(SPRINKLE[i % 6]), rnd(-0.5, 0.5), rnd(0.1, 1.1), rnd(-0.3, 0.3)).rotateZ(rnd(0, 3))); } break;
    case "hearts": f({ mood: "smile" }); for (let i = 0; i < 3; i++) { const h = mesh(heart(0.06 + i * 0.01, 0.02), M(0xff3d7a, { roughness: 0.3 })); h.position.set(-0.3 + i * 0.3, top + 0.08 + (i % 2) * 0.12, 0.05); g.add(h); } break;
    case "tie": f({ mood: "smile" }); { const t = cone(0.06, 0.24, M(0x3d5afe, { roughness: 0.4 }), 0, 0, 0, 4); t.rotation.x = Math.PI; stick(g, t, hc, hr, 0, -0.62, 0.02); g.add(rbox(0.32, 0.22, 0.08, 0.02, M(0x6b3e1e, { roughness: 0.5 }), 0.42, 0.11, 0.1)); g.add(ring(0.05, 0.012, M(0x333333), 0.42, 0.25, 0.1)); } break;
    case "space": f({ mood: "open" }); { const r = ring(0.55, 0.035, M(0xffd54a, { roughness: 0.3 }), 0, baseY, 0); r.rotation.x = Math.PI / 2 - 0.35; g.add(r); for (const s of [-1, 1]) { g.add(cyl(0.01, 0.01, 0.2, M(0x888888), s * 0.12, top + 0.06, 0)); g.add(ball(0.035, M(0xff5d8f, { emissive: 0xff5d8f, emissiveIntensity: 0.8 }), s * 0.12, top + 0.17, 0)); } } break;
    case "royal": f({ mood: "smile" }); { g.add(cyl(0.16, 0.15, 0.1, gold, 0, top + 0.02, 0, 18, true)); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.add(cone(0.035, 0.09, gold, Math.cos(a) * 0.155, top + 0.1, Math.sin(a) * 0.155)); } const cape = mesh(new THREE.CylinderGeometry(0.3, 0.46, 0.6, seg(16), 1, true, Math.PI * 0.55, Math.PI * 0.9), M(0xb0183a, { side: THREE.DoubleSide, roughness: 0.6 })); cape.position.set(0, baseY - 0.12, -0.02); g.add(cape); } break;
    case "hot": f({ mood: "oh" }); for (let i = 0; i < 4; i++) g.add(ball(0.08 + i * 0.015, M(0xffffff, { transparent: true, opacity: 0.6, depthWrite: false }), -0.1 + (i % 2) * 0.2, top + 0.08 + i * 0.12, -0.05)); g.add(ball(0.04, M(0x8fd8ff, { transparent: true, opacity: 0.9 }), 0.3, baseY + 0.25, 0.25, 1, 1.4, 0.6)); break;
    default: f({});
  }
  return p.acc === "party" ? top + 0.3 : p.acc === "hot" ? top + 0.4 : top + 0.08;
}

// ==========================================================================
//  Critters — Pocket Pets (whole animals) and Glow-Up Faces (big heads)
// ==========================================================================
export const CRITTERS = {
  kitten: { c: 0xffb066, belly: 0xfff1de, ears: "tri", tail: "long", whisk: true, mood: "cat", inner: 0xff9ab8 },
  puppy: { c: 0xd9a066, belly: 0xfff1de, ears: "floppy", earC: 0x8a5a2b, tail: "short", muzzle: 0xfff1de },
  bunny: { c: 0xfff5f8, belly: 0xffffff, ears: "long", tail: "puff", inner: 0xffb3cf },
  hamster: { c: 0xf2b46a, belly: 0xffffff, ears: "round", inner: 0xffb3cf, cheeks: 0xffffff },
  bear: { c: 0xb07a4a, belly: 0xf2d6b0, ears: "round", inner: 0xf2d6b0, muzzle: 0xf2d6b0 },
  panda: { c: 0xffffff, belly: 0xffffff, ears: "round", earC: 0x222228, patches: 0x222228, limbs: 0x222228 },
  penguin: { c: 0x2a3550, belly: 0xffffff, ears: "none", beak: 0xffa726, faceC: 0xffffff },
  fox: { c: 0xff8a3d, belly: 0xffffff, ears: "pointy", earC: 0xff8a3d, inner: 0x5a2a10, tail: "fluffy", muzzle: 0xffffff },
  bluefox: { c: 0x5aa9ff, belly: 0xffffff, ears: "pointy", earC: 0x5aa9ff, inner: 0x1d4fa8, tail: "fluffy", muzzle: 0xffffff, captain: true },
  frog: { c: 0x7ccf5a, belly: 0xd8f5b0, ears: "frog" },
  axolotl: { c: 0xffb3d1, belly: 0xffd6e6, ears: "gills", earC: 0xff6fa8, tail: "long" },
  sloth: { c: 0xb59a7a, belly: 0xe8d8c0, ears: "none", mask: 0x6b4f3a, faceC: 0xf0e0c8, mood: "happy" },
  unicorn: { c: 0xffffff, belly: 0xfff0fa, ears: "tri", inner: 0xffb3cf, horn: true, mane: [0xff8ac8, 0xbfeaff, 0xe6ccff, 0xfff3a0, 0xa8f0cf], tail: "mane" },
  dragon: { c: 0x7fe0b0, belly: 0xfff3b0, ears: "horns", wings: 0x4fc890, tail: "long", spikes: 0xffd54a },
  lamb: { c: 0xfff6ea, belly: 0xffffff, ears: "floppy", earC: 0xf2d6c0, wool: 0xffffff, faceC: 0xfff0e6 },
  chick: { c: 0xffe066, belly: 0xfff3b0, ears: "tuft", beak: 0xffa726 },
};
function buildCritter(p, g, rand, headOnly) {
  const A = CRITTERS[p.a] || CRITTERS.kitten; const skin = S(A.c), belly = M(A.belly || A.c, { roughness: 0.55 }), earM = A.earC ? S(A.earC) : skin, inner = M(A.inner || 0xffb3cf, { roughness: 0.6 });
  let hc, hr;
  if (headOnly) {
    g.add(rbox(1.15, 0.24, 0.95, 0.11, M(0xffc2dd, { roughness: 0.9 }), 0, 0.12, 0)); for (const [x, z] of [[-0.52, -0.42], [0.52, -0.42], [-0.52, 0.42], [0.52, 0.42]]) g.add(ball(0.05, M(0xffd700, { metalness: 0.6, roughness: 0.3 }), x, 0.12, z));
    hc = [0, 0.72, 0]; hr = 0.48;
  } else {
    hc = [0, 0.8, 0.02]; hr = 0.32;
    const by = A.ears === "none" && p.a === "penguin" ? 0.34 : 0.3;
    g.add(ball(0.31, skin, 0, by, 0, 1, p.a === "penguin" ? 1.15 : 0.95, 0.92)); g.add(ball(0.22, belly, 0, by - 0.02, 0.14, 1, 1.05, 0.7));
    const limb = A.limbs ? S(A.limbs) : skin; for (const s of [-1, 1]) { g.add(ball(0.09, A.beak && p.a === "penguin" ? M(A.beak) : limb, s * 0.14, 0.06, 0.18, 1, 0.7, 1.3)); const arm = ball(0.08, limb, s * 0.27, 0.36, 0.1, 0.8, 1.3, 0.8); arm.rotation.z = s * 0.4; g.add(arm); }
    if (A.tail === "long") { const t = cap(0.06, 0.32, skin, 0, 0.22, -0.34); t.rotation.x = -1.0; g.add(t); if (A.spikes) for (let i = 0; i < 3; i++) g.add(cone(0.04, 0.09, M(A.spikes), 0, 0.5 - i * 0.12, -0.26 - i * 0.04)); }
    if (A.tail === "short") { const t = cap(0.05, 0.12, skin, 0, 0.32, -0.3); t.rotation.x = -0.6; g.add(t); }
    if (A.tail === "puff") g.add(ball(0.1, belly, 0, 0.18, -0.3));
    if (A.tail === "fluffy") { const t = ball(0.13, skin, 0.12, 0.3, -0.34, 0.9, 1.6, 0.9); t.rotation.z = -0.5; g.add(t); g.add(ball(0.08, belly, 0.24, 0.5, -0.38)); }
    if (A.tail === "mane") A.mane.forEach((c, i) => g.add(ball(0.06, M(c), 0, 0.3 - i * 0.04, -0.3 - i * 0.04)));
    if (A.wings) for (const s of [-1, 1]) { const w = mesh(new THREE.CircleGeometry(0.22, seg(12), 0, Math.PI), M(A.wings, { side: THREE.DoubleSide, roughness: 0.5 })); w.position.set(s * 0.18, 0.46, -0.2); w.rotation.set(0, s * 0.9, s * 0.3); g.add(w); }
  }
  const head = ball(hr, skin, ...hc, 1.04, 0.97, 1); g.add(head);
  if (A.faceC) { const fp = ball(hr * 0.74, M(A.faceC, { roughness: 0.55 }), hc[0], hc[1] - hr * 0.04, hc[2] + hr * 0.58, 1.15, 0.92, 0.55); g.add(fp); }
  if (A.patches) for (const s of [-1, 1]) { const pt = ball(hr * 0.16, M(A.patches, { roughness: 0.5 })); stick(g, pt, hc, hr, s * 0.37, 0.02, -0.01); pt.scale.set(1, 1.3, 0.4); pt.rotateZ(s * 0.5); }
  if (A.mask) for (const s of [-1, 1]) { const pt = ball(hr * 0.2, M(A.mask, { roughness: 0.5 })); stick(g, pt, hc, hr, s * 0.38, 0.05, 0.0); pt.scale.set(1.5, 0.75, 0.4); pt.rotateZ(-s * 0.45); }
  const out = A.faceC ? 0.012 : A.patches || A.mask ? 0.012 : 0;
  let mouthOut = 0;
  if (A.muzzle) { const mz = ball(hr * 0.3, M(A.muzzle, { roughness: 0.55 })); stick(g, mz, hc, hr, 0, -0.3, -hr * 0.12); mz.scale.set(1.3, 0.85, 0.75); const nose = ball(hr * 0.08, M(0x2a1a1a, { roughness: 0.2 })); stick(g, nose, hc, hr, 0, -0.18, hr * 0.1); mouthOut = hr * 0.1; }
  if (A.beak) { const b = coneOut(hr * 0.13, hr * 0.22, M(A.beak, { roughness: 0.35 })); stick(g, b, hc, hr, 0, -0.18, -0.01); }
  if (A.ears === "frog") {
    for (const s of [-1, 1]) { const bc = onBall(hc, hr, s * 0.42, 0.62, -hr * 0.08); g.add(ball(hr * 0.3, skin, bc.x, bc.y, bc.z)); kawaii(g, [bc.x, bc.y, bc.z], hr * 0.3, { size: hr * 0.13, gap: 0, ey: hr * 0.05, blush: false, mouth: false }); }
    const sm = ring(hr * 0.3, hr * 0.03, mouthM(), 0, 0, 0, Math.PI); stick(g, sm, hc, hr, 0, -0.08, 0); sm.rotateZ(Math.PI);
    for (const s of [-1, 1]) { const b = mesh(new THREE.CircleGeometry(hr * 0.12, 14), blushM()); b.userData.keep = true; stick(g, b, hc, hr, s * 0.55, -0.12, 0.006); }
  } else {
    kawaii(g, hc, hr, { size: hr * 0.15, gap: hr * 0.36, ey: hr * 0.03, my: A.beak ? -hr * 0.42 : -hr * 0.22, mood: A.mood || "smile", out, mouthOut: A.beak ? 0 : mouthOut });
  }
  const ear = (yaw, pitch, o) => stick(g, o, hc, hr, yaw, pitch, -hr * 0.06);
  if (A.ears === "tri" || A.ears === "pointy") for (const s of [-1, 1]) { const tall = A.ears === "pointy" ? 0.62 : 0.45; const e = ear(s * 0.62, 0.85, coneOut(hr * 0.3, hr * tall, earM)); e.scale.set(1, 0.5, 1); const ie = coneOut(hr * 0.18, hr * tall * 0.75, inner); ie.position.set(0, -hr * 0.12, hr * 0.03); ie.scale.set(1, 0.3, 1); e.add(ie); }
  if (A.ears === "round") for (const s of [-1, 1]) { const e = ear(s * 0.72, 0.78, ball(hr * 0.27, earM)); e.scale.set(1, 1, 0.55); if (A.inner && !A.earC) { const ie = ball(hr * 0.15, inner); ie.position.set(0, 0, hr * 0.1); ie.scale.set(1, 1, 0.5); e.add(ie); } }
  if (A.ears === "floppy") for (const s of [-1, 1]) { const e = ball(hr * 0.32, earM, hc[0] + s * hr * 1.0, hc[1] - hr * 0.05, hc[2] + hr * 0.05, 0.45, 1.05, 0.75); e.rotation.z = s * 0.3; g.add(e); }
  if (A.ears === "long") for (const s of [-1, 1]) { const e = cap(hr * 0.15, hr * 0.9, skin, hc[0] + s * hr * 0.32, hc[1] + hr * 1.35, hc[2] - hr * 0.05); e.rotation.z = -s * 0.15; e.scale.z = 0.6; g.add(e); const ie = cap(hr * 0.08, hr * 0.7, inner, hc[0] + s * hr * 0.33, hc[1] + hr * 1.35, hc[2] + hr * 0.04); ie.rotation.z = -s * 0.15; ie.scale.z = 0.3; g.add(ie); }
  if (A.ears === "gills") for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const gl = cap(hr * 0.07, hr * 0.38, earM); gl.position.copy(onBall(hc, hr, s * 1.35, 0.15 + i * 0.32, 0.02)); gl.rotation.z = -s * (0.9 - i * 0.55); g.add(gl); }
  if (A.ears === "horns") { for (const s of [-1, 1]) { ear(s * 0.35, 1.0, coneOut(hr * 0.1, hr * 0.32, M(A.spikes, { roughness: 0.3 }))); const e = ear(s * 0.8, 0.6, coneOut(hr * 0.16, hr * 0.26, skin)); e.scale.set(1, 0.5, 1); } }
  if (A.ears === "tuft") for (let i = -1; i <= 1; i++) { const t = cap(hr * 0.06, hr * 0.25, skin, hc[0] + i * hr * 0.12, hc[1] + hr * 1.08, hc[2]); t.rotation.z = -i * 0.5; g.add(t); }
  if (A.whisk) for (const s of [-1, 1]) for (const k of [-1, 0, 1]) { const w = cyl(hr * 0.012, hr * 0.012, hr * 0.5, M(0x553333)); w.position.copy(onBall(hc, hr, s * 0.55, -0.2 + k * 0.08, 0.0)); w.rotation.z = Math.PI / 2 + k * 0.18 * s; g.add(w); }
  if (A.cheeks) for (const s of [-1, 1]) { const ck = ball(hr * 0.28, M(A.cheeks, { roughness: 0.55 })); stick(g, ck, hc, hr, s * 0.7, -0.35, -hr * 0.16); }
  if (A.horn) { const h = ear(0, 1.12, coneOut(hr * 0.1, hr * 0.55, M(0xffd76a, { metalness: 0.7, roughness: 0.25 }))); h.position.z += hr * 0.08; A.mane.forEach((c, i) => { const m = ball(hr * 0.17, M(c, { roughness: 0.5 })); stick(g, m, hc, hr, 0.15 - (i % 2) * 0.3, 1.25 - i * 0.28, -hr * 0.05); }); }
  if (A.wool) for (let i = 0; i < 12; i++) { const w = ball(hr * 0.22, S(A.wool, { roughness: 0.9 })); stick(g, w, hc, hr, -1.2 + (i % 6) * 0.48, 0.8 + Math.floor(i / 6) * 0.35, -hr * 0.08); }
  if (A.captain) { const hat = new THREE.Group(); hat.add(cyl(hr * 0.5, hr * 0.55, hr * 0.28, M(0xffffff, { roughness: 0.5 }), 0, hr * 0.14, 0), cyl(hr * 0.56, hr * 0.56, hr * 0.06, M(0x1d2a5a), 0, 0.01, 0)); const brim = cyl(hr * 0.4, hr * 0.4, hr * 0.04, M(0x1d2a5a), 0, 0, hr * 0.3); brim.scale.z = 0.5; hat.add(brim); const st = mesh(star(hr * 0.12, 0.02), M(0xffc93c, { metalness: 0.8, roughness: 0.2 })); st.position.set(0, hr * 0.15, hr * 0.5); hat.add(st); hat.position.set(hc[0], hc[1] + hr * 0.82, hc[2]); hat.rotation.x = -0.15; g.add(hat); }
  g.userData.hc = hc; g.userData.hr = hr; g.userData.head = head;
  return hc[1] + hr * (A.ears === "long" ? 2.2 : 1.25);
}

// ==========================================================================
//  Dino Eggs
// ==========================================================================
function buildDino(p, g, rand) {
  const a = p.a, skin = S(p.c), belly = M(new THREE.Color(p.c).lerp(new THREE.Color(0xfff3c4), 0.6).getHex(), { roughness: 0.55 });
  const spikeM = p.lava ? M(0xffb020, { emissive: 0xff6a00, emissiveIntensity: 0.9, roughness: 0.4 }) : M(new THREE.Color(p.c).offsetHSL(0.06, 0, -0.16).getHex(), { roughness: 0.4 });
  const quad = ["trike", "stego", "long", "anky"].includes(a); let hc, hr;
  if (quad) {
    g.add(ball(0.32, skin, 0, 0.4, -0.05, 1.05, 0.82, 1.35)); g.add(ball(0.26, belly, 0, 0.3, 0.02, 0.95, 0.55, 1.2));
    for (const x of [-0.2, 0.2]) for (const z of [-0.3, 0.22]) g.add(cap(0.085, 0.16, skin, x, 0.16, z));
    const tail = cone(0.15, 0.62, skin, 0, 0.38, -0.66); tail.rotation.x = -Math.PI / 2 - 0.25; g.add(tail);
    if (a === "long") { const neck = cap(0.1, 0.55, skin, 0, 0.8, 0.36); neck.rotation.x = 0.45; g.add(neck); hc = [0, 1.12, 0.52]; hr = 0.2; } else { hc = [0, 0.52, 0.48]; hr = 0.23; }
  } else {
    g.add(ball(0.3, skin, 0, 0.42, -0.02, 1, 1.05, 1)); g.add(ball(0.22, belly, 0, 0.4, 0.12, 0.95, 1, 0.6));
    for (const x of [-0.14, 0.14]) { g.add(ball(0.11, skin, x, 0.13, 0.04, 1, 1.1, 1.2)); g.add(ball(0.06, skin, x, 0.04, 0.15, 1, 0.6, 1.3)); }
    if (a !== "chicko") { const tail = cone(0.15, 0.62, skin, 0, 0.32, -0.46); tail.rotation.x = -Math.PI / 2 - 0.5; g.add(tail); } else for (let i = -1; i <= 1; i++) { const f = cap(0.05, 0.22, skin, i * 0.07, 0.5, -0.32); f.rotation.x = -0.7; f.rotation.z = i * 0.3; g.add(f); }
    for (const x of [-0.2, 0.2]) { const arm = cap(0.035, 0.08, skin, x, 0.5, 0.2); arm.rotation.x = -1.0; g.add(arm); }
    hc = [0, 0.88, 0.08]; hr = a === "baby" ? 0.31 : 0.27;
  }
  g.add(ball(hr, skin, ...hc, 1.05, 0.95, 1.05));
  const snout = !["baby", "chicko", "ptero"].includes(a);
  if (snout) { const sn = ball(hr * 0.55, skin); stick(g, sn, hc, hr, 0, -0.35, -hr * 0.25); sn.scale.set(1.25, 0.8, 1); for (const s2 of [-1, 1]) { const n = ball(hr * 0.05, M(0x3a2a2a)); stick(g, n, hc, hr, s2 * 0.12, -0.22, hr * 0.27); } }
  kawaii(g, hc, hr, { size: hr * 0.16, gap: hr * 0.4, ey: hr * 0.14, my: -hr * 0.3, mouthOut: snout ? hr * 0.22 : 0 });
  let top = hc[1] + hr;
  const back = (n, y0, z0, dy, dz, sz = 0.06) => { for (let i = 0; i < n; i++) { const c = cone(sz, sz * 2.2, spikeM, 0, y0 - i * dy, z0 - i * dz); c.rotation.x = -0.35 - i * 0.12; g.add(c); } };
  if (a === "rex") { back(4, 0.68, -0.18, 0.08, 0.09); if (p.lava) for (let i = 0; i < 6; i++) { const sp = mesh(new THREE.CircleGeometry(0.035, 10), spikeM); stick(g, sp, [0, 0.42, -0.02], 0.3, rand() * 2 - 1, rand() * 1.2 - 0.6, 0.006); } }
  if (a === "trike") { const fr = mesh(new THREE.CircleGeometry(hr * 1.25, seg(20), 0, Math.PI), M(new THREE.Color(p.c).offsetHSL(0.05, 0, -0.1).getHex(), { side: THREE.DoubleSide, roughness: 0.5 })); fr.position.set(0, hc[1] + 0.02, hc[2] - hr * 0.55); fr.rotation.x = -0.35; g.add(fr); for (const s2 of [-1, 1]) stick(g, coneOut(hr * 0.1, hr * 0.6, M(0xfff3dc, { roughness: 0.4 })), hc, hr, s2 * 0.38, 0.55, -0.02); stick(g, coneOut(hr * 0.08, hr * 0.3, M(0xfff3dc, { roughness: 0.4 })), hc, hr, 0, -0.1, hr * 0.25); top += 0.15; }
  if (a === "stego") { for (let i = 0; i < 5; i++) { const pl = cone(0.11 - Math.abs(i - 2) * 0.015, 0.24, i % 2 ? spikeM : M(0xff5d8f, { roughness: 0.4 }), 0, 0.72 - Math.abs(i - 2) * 0.03, 0.24 - i * 0.16, 4); pl.scale.z = 0.3; g.add(pl); } for (const s2 of [-1, 1]) { const t = cone(0.03, 0.14, spikeM, s2 * 0.06, 0.32, -0.96); t.rotation.z = s2 * 0.9; g.add(t); } top = Math.max(top, 0.86); }
  if (a === "anky") { for (let i = 0; i < 12; i++) g.add(ball(0.055, spikeM, (i % 3 - 1) * 0.16, 0.62 - Math.abs(i % 3 - 1) * 0.06, 0.28 - Math.floor(i / 3) * 0.17)); g.add(ball(0.12, spikeM, 0, 0.26, -1.0)); }
  if (a === "raptor") { for (let i = -1; i <= 1; i++) { const f = cap(0.03, 0.14, spikeM, hc[0] + i * 0.06, hc[1] + hr * 0.95, hc[2] - hr * 0.2); f.rotation.x = -0.6; f.rotation.z = -i * 0.4; g.add(f); } }
  if (a === "para") { const cr = cap(0.06, 0.45, spikeM, 0, hc[1] + hr * 0.8, hc[2] - hr * 0.9); cr.rotation.x = -1.05; g.add(cr); }
  if (a === "spino") { const sail = mesh(new THREE.CircleGeometry(0.34, seg(20), 0, Math.PI), M(0xff8a3d, { side: THREE.DoubleSide, roughness: 0.45 })); sail.position.set(0, 0.6, -0.08); sail.rotation.y = Math.PI / 2; g.add(sail); }
  if (a === "ptero") { for (const s2 of [-1, 1]) { const sh = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.75, 0.25), new THREE.Vector2(0.6, -0.15)]); const w = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }), spikeM); w.position.set(s2 * 0.18, 0.55, -0.05); w.scale.x = s2; w.rotation.x = 0.2; g.add(w); } stick(g, coneOut(hr * 0.15, hr * 0.5, M(0xffc93c, { roughness: 0.35 })), hc, hr, 0, -0.2, -0.02); const cr = cone(0.06, 0.3, spikeM, 0, hc[1] + hr * 0.6, hc[2] - hr * 0.8); cr.rotation.x = -1.2; g.add(cr); }
  if (a === "baby") { const shell = mesh(new THREE.SphereGeometry(hr * 1.06, seg(24), seg(10), 0, TAU, 0, Math.PI * 0.32), M(0xfff6e6, { roughness: 0.5, side: THREE.DoubleSide })); shell.position.set(...hc); shell.rotation.z = 0.25; g.add(shell); top += 0.05; }
  if (a === "chicko") { for (let i = 0; i < 3; i++) g.add(ball(0.06 - Math.abs(i - 1) * 0.01, M(0xe53935, { roughness: 0.45 }), 0, hc[1] + hr * 0.95 + (i === 1 ? 0.03 : 0), hc[2] - 0.06 + i * 0.06, 0.6, 1, 1)); stick(g, coneOut(hr * 0.13, hr * 0.28, M(0xffa726, { roughness: 0.35 })), hc, hr, 0, -0.15, -0.02); const w = ball(hr * 0.12, M(0xe53935, { roughness: 0.45 })); stick(g, w, hc, hr, 0, -0.42, -0.01); w.scale.set(0.8, 1.4, 0.7); top += 0.08; }
  return top;
}
// the egg every dino comes in (top and bottom halves; cracks get drawn on as you tap)
export function makeDinoEgg(color = 0x9ff0c8) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g2 = c.getContext("2d"); g2.fillStyle = "#fff6e4"; g2.fillRect(0, 0, 512, 256);
  const spot = `#${new THREE.Color(color).getHexString()}`; for (let i = 0; i < 70; i++) { g2.fillStyle = spot; g2.globalAlpha = rnd(0.4, 0.9); g2.beginPath(); g2.ellipse(rnd(0, 512), rnd(0, 256), rnd(6, 18), rnd(4, 12), rnd(0, 3), 0, TAU); g2.fill(); } g2.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.45, clearcoat: 0.5, side: THREE.DoubleSide });
  const half = (a0, a1) => { const geo = new THREE.SphereGeometry(0.5, 40, 24, 0, TAU, a0, a1 - a0); const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); const k = 1 - y * 0.3; pa.setXYZ(i, pa.getX(i) * k, y * 1.3, pa.getZ(i) * k); } geo.computeVertexNormals(); return new THREE.Mesh(geo, m); };
  const egg = new THREE.Group(), top = new THREE.Group(), bottom = half(Math.PI * 0.52, Math.PI); top.add(half(0, Math.PI * 0.52)); egg.add(top, bottom); egg.position.y = 0.65; const wrap = new THREE.Group(); wrap.add(egg);
  wrap.userData = { egg, top, bottom, crack(n) { g2.strokeStyle = "#5a3a20"; g2.lineWidth = 5; g2.lineJoin = "round"; for (let k = 0; k < n; k++) { let x = rnd(0, 512), y = 128 + rnd(-30, 30); g2.beginPath(); g2.moveTo(x, y); for (let j = 0; j < 6; j++) { x += rnd(10, 26) * (Math.random() < 0.5 ? -1 : 1); y += rnd(-18, 18); g2.lineTo(x, y); } g2.stroke(); } tex.needsUpdate = true; } };
  return wrap;
}

// ==========================================================================
//  Slime Pots — the blob is its own geometry so it can be stretched
// ==========================================================================
const swirlTex = (cols) => canvasTex(`swirl:${cols.join()}`, 256, 256, (g, n) => { g.fillStyle = cols[0]; g.fillRect(0, 0, n, n); g.lineWidth = 26; for (let i = 0; i < 24; i++) { g.strokeStyle = cols[i % cols.length]; g.beginPath(); for (let k = 0; k <= 40; k++) { const t = k / 40, a = t * 9 + i * 0.6, r = t * n * 0.9; g.lineTo(n / 2 + Math.cos(a) * r, n / 2 + Math.sin(a) * r * 0.6 + (i - 12) * 10); } g.stroke(); } }, 1);
function buildSlime(p, g, rand) {
  const tubM = M(0xffffff, { transparent: true, opacity: 0.32, roughness: 0.05, side: THREE.DoubleSide }), lidM = M(p.lid, { roughness: 0.3 });
  g.add(cyl(0.45, 0.41, 0.3, tubM, 0, 0.15, 0, 36, true), cyl(0.41, 0.41, 0.02, M(0xffffff, { transparent: true, opacity: 0.5 }), 0, 0.01, 0), ring(0.45, 0.025, lidM, 0, 0.3, 0).rotateX(Math.PI / 2));
  const lid = cyl(0.47, 0.47, 0.07, lidM, 0, 0.42, -0.55, 36); lid.rotation.x = Math.PI / 2 - 0.3; g.add(lid);
  const o = { roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }; if (p.clear) Object.assign(o, { transparent: true, opacity: 0.78 }); if (p.glowy) Object.assign(o, { emissive: p.c, emissiveIntensity: 0.55 }); if (p.swirl) o.map = swirlTex(p.swirl);
  const blob = mesh(new THREE.SphereGeometry(0.4, seg(56), seg(36)), S(p.c, o), 0, 0.34, 0); blob.scale.set(1.02, 0.78, 1.02); g.add(blob);
  const R = rng(hash(String(p.c) + (p.mix || ""))), surf = (k = 1) => { const th = R() * TAU, ph = R() * Math.PI * 0.55; return new V3(Math.sin(ph) * Math.cos(th) * 0.4 * k, Math.cos(ph) * 0.4 * k, Math.sin(ph) * Math.sin(th) * 0.4 * k); };
  if (p.mix === "beads") for (let i = 0; i < 26; i++) { const v = surf(); blob.add(ball(0.025, M(SPRINKLE[i % 6], { roughness: 0.15 }), v.x, v.y, v.z)); }
  if (p.mix === "snow") for (let i = 0; i < 40; i++) { const v = surf(); blob.add(ball(0.015, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.3 }), v.x, v.y, v.z)); }
  if (p.mix === "stars") for (let i = 0; i < 12; i++) { const v = surf(); const st = mesh(star(0.035, 0.012), M(0xffe066, { emissive: 0xffc93c, emissiveIntensity: 0.7 })); st.position.copy(v); st.quaternion.setFromUnitVectors(Z, v.clone().normalize()); blob.add(st); }
  if (p.mix === "fish") for (let i = 0; i < 4; i++) { const v = surf(0.7); const f = ball(0.04, M(0xff8a3d), v.x, v.y, v.z, 1, 0.8, 1.4); const t = cone(0.03, 0.05, M(0xff8a3d), 0, 0, -0.05); t.rotation.x = Math.PI / 2; f.add(t); f.rotation.y = R() * 6; blob.add(f); }
  kawaii(g, [0, 0.36, 0], 0.4, { size: 0.05, gap: 0.12, ey: 0.06, my: -0.03, out: 0.01 });
  g.userData.slime = blob; return 0.7;
}

// ==========================================================================
//  Ocean Buddies
// ==========================================================================
const shellTex = () => canvasTex("turtleshell", 256, 256, (g, n) => { g.fillStyle = "#8a6a3a"; g.fillRect(0, 0, n, n); g.strokeStyle = "#e8d29a"; g.lineWidth = 6; const s = 52; for (let y = -s; y < n + s; y += s * 0.86) for (let x = -s; x < n + s; x += s) { const ox = (Math.round(y / (s * 0.86)) % 2) * s / 2; g.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; g.lineTo(x + ox + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5); } g.closePath(); g.stroke(); } }, 1);
function buildSea(p, g, rand) {
  const a = p.a, skin = S(p.c), light = M(new THREE.Color(p.c).lerp(new THREE.Color(0xffffff), 0.6).getHex(), { roughness: 0.5 }), finM = M(p.fin || new THREE.Color(p.c).offsetHSL(0, 0, -0.12).getHex(), { roughness: 0.45, side: THREE.DoubleSide });
  const face = (c, r, o = {}) => kawaii(g, c, r, { size: r * 0.16, gap: r * 0.38, ey: r * 0.08, my: -r * 0.2, ...o });
  const tailFin = (y, z, s2 = 1) => { const t = cone(0.2 * s2, 0.28 * s2, finM, 0, y, z); t.rotation.x = Math.PI / 2; t.scale.x = 0.25; g.add(t); };
  switch (a) {
    case "fish": { g.add(ball(0.36, skin, 0, 0.5, 0, 0.82, 0.92, 1.1)); tailFin(0.5, -0.5); const d = cone(0.14, 0.22, finM, 0, 0.88, -0.08); d.scale.z = 0.3; d.rotation.x = -0.4; g.add(d); for (const s2 of [-1, 1]) { const f = ball(0.1, finM, s2 * 0.3, 0.42, 0.05, 0.25, 0.6, 1); f.rotation.y = s2 * 0.6; g.add(f); }
      if (p.stripe) for (const z of [0.12, -0.18]) { const k = Math.sqrt(1 - (z / 0.396) ** 2), r = ring(1, 0.11, M(p.stripe, { roughness: 0.4 }), 0, 0.5, z); r.scale.set(0.295 * k + 0.012, 0.331 * k + 0.012, 1); g.add(r); }
      face([0, 0.52, 0.02], 0.38); return 0.95; }
    case "octo": { g.add(ball(0.36, skin, 0, 0.62, 0, 1, 1.05, 1)); for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU; const t = cap(0.07, 0.28, skin, Math.cos(an) * 0.26, 0.2, Math.sin(an) * 0.26); t.rotation.z = Math.cos(an) * 0.7; t.rotation.x = -Math.sin(an) * 0.7; g.add(t); g.add(ball(0.07, skin, Math.cos(an) * 0.42, 0.06, Math.sin(an) * 0.42)); } face([0, 0.6, 0], 0.36); return 1.0; }
    case "crab": { g.add(ball(0.36, skin, 0, 0.36, 0, 1.15, 0.6, 0.85)); for (const s2 of [-1, 1]) { for (let k = 0; k < 3; k++) { const l = cap(0.035, 0.18, skin, s2 * (0.35 + k * 0.04), 0.14, -0.1 + k * 0.1); l.rotation.z = s2 * 0.8; g.add(l); } const arm = cap(0.05, 0.18, skin, s2 * 0.42, 0.42, 0.18); arm.rotation.z = -s2 * 0.7; g.add(arm); g.add(ball(0.13, skin, s2 * 0.52, 0.6, 0.22, 1, 0.8, 0.7)); const pin = cone(0.05, 0.14, skin, s2 * 0.52, 0.74, 0.25); pin.rotation.z = -s2 * 0.4; g.add(pin);
        g.add(cyl(0.02, 0.02, 0.18, skin, s2 * 0.12, 0.62, 0.12)); g.add(ball(0.07, M(0xffffff, { roughness: 0.3 }), s2 * 0.12, 0.74, 0.12)); kawaii(g, [s2 * 0.12, 0.74, 0.12], 0.07, { size: 0.045, gap: 0, ey: 0, blush: false, mouth: false }); }
      const sm = ring(0.07, 0.014, mouthM(), 0, 0.36, 0.3, Math.PI); sm.rotation.z = Math.PI; g.add(sm); for (const s2 of [-1, 1]) { const b = mesh(new THREE.CircleGeometry(0.05, 14), blushM()); b.position.set(s2 * 0.16, 0.4, 0.29); g.add(b); } return 0.9; }
    case "star": { const st = mesh(star(0.5, 0.16, 0.5), skin); st.position.set(0, 0.52, 0); g.add(st); for (let i = 0; i < 14; i++) { const an = rand() * TAU, r = rand() * 0.35; g.add(ball(0.02, light, Math.cos(an) * r, 0.52 + Math.sin(an) * r, 0.13)); } face([0, 0.5, 0.15 - 3], 3, { size: 0.05, gap: 0.1, ey: 0.02, my: -0.06, out: 0.005 }); return 1.0; }
    case "turtle": { const sh = mesh(new THREE.SphereGeometry(0.42, seg(32), seg(16), 0, TAU, 0, Math.PI / 2), S(0x8a6a3a, { map: shellTex() }), 0, 0.2, -0.05); sh.scale.set(1, 0.8, 1.1); g.add(sh); g.add(cyl(0.43, 0.43, 0.06, light, 0, 0.2, -0.05)); for (const s2 of [-1, 1]) for (const z of [-0.3, 0.25]) { const f = ball(0.13, skin, s2 * 0.4, 0.14, z, 1.3, 0.35, 0.8); f.rotation.y = s2 * (z > 0 ? -0.5 : 0.5); g.add(f); } g.add(ball(0.2, skin, 0, 0.36, 0.48)); face([0, 0.37, 0.48], 0.2); return 0.62; }
    case "puffer": { g.add(ball(0.4, skin, 0, 0.5, 0)); g.add(ball(0.3, light, 0, 0.4, 0.14, 1, 0.8, 0.8)); for (let i = 0; i < 26; i++) { const th = rand() * TAU, ph = 0.3 + rand() * 2.6; stick(g, coneOut(0.03, 0.1, M(0xffb300, { roughness: 0.4 })), [0, 0.5, 0], 0.39, th, Math.PI / 2 - ph, 0); } tailFin(0.5, -0.46, 0.8); face([0, 0.5, 0], 0.4, { mood: "oh" }); return 1.0; }
    case "jelly": { const dome = mesh(new THREE.SphereGeometry(0.38, seg(32), seg(16), 0, TAU, 0, Math.PI / 2), S(p.c, { transparent: true, opacity: 0.75, roughness: 0.1, emissive: p.c, emissiveIntensity: 0.25 }), 0, 0.62, 0); dome.scale.y = 0.85; g.add(dome); g.add(ring(0.36, 0.035, S(p.c), 0, 0.62, 0).rotateX(Math.PI / 2));
      for (let i = 0; i < 7; i++) { const an = (i / 7) * TAU; for (let k = 0; k < 4; k++) g.add(ball(0.035 - k * 0.004, S(p.c, { transparent: true, opacity: 0.8 }), Math.cos(an) * (0.24 + Math.sin(k + i) * 0.04), 0.55 - k * 0.13, Math.sin(an) * 0.24)); } face([0, 0.72, 0], 0.32); return 0.98; }
    case "seahorse": { for (const [y, z, r] of [[0.95, 0.02, 0.17], [0.78, -0.02, 0.15], [0.62, 0.0, 0.17], [0.46, 0.03, 0.16], [0.32, 0.0, 0.13], [0.2, -0.06, 0.1], [0.12, -0.14, 0.08], [0.12, -0.24, 0.06]]) g.add(ball(r, skin, 0, y, z)); for (let i = 0; i < 4; i++) g.add(cone(0.04, 0.1, finM, 0, 0.9 - i * 0.14, -0.16)); const sn = cyl(0.05, 0.07, 0.18, skin, 0, 0.92, 0.2); sn.rotation.x = Math.PI / 2; g.add(sn); face([0, 1.0, 0.02], 0.17, { size: 0.035, gap: 0.07, my: -0.05 }); return 1.18; }
    default: { const sharky = a === "shark"; g.add(ball(0.4, skin, 0, 0.42, 0, 1.0, 0.85, 1.25)); g.add(ball(0.33, light, 0, 0.32, 0.1, 0.95, 0.6, 1.15)); tailFin(0.5, -0.6, 1.1); // whale, shark, narwhal
      for (const s2 of [-1, 1]) { const f = ball(0.12, finM, s2 * 0.38, 0.3, 0.12, 0.25, 0.5, 1); f.rotation.z = s2 * 0.6; g.add(f); }
      if (sharky) { const d = cone(0.14, 0.32, finM, 0, 0.86, -0.05); d.scale.z = 0.3; d.rotation.x = -0.3; g.add(d); }
      if (a === "whale") for (let i = 0; i < 5; i++) g.add(ball(0.05, M(0x9fdcff, { transparent: true, opacity: 0.8 }), Math.cos(i * 1.3) * 0.08, 0.85 + (i % 2) * 0.06, -0.05 + Math.sin(i * 1.3) * 0.08));
      if (a === "narwhal") { const horn = coneOut(0.04, 0.5, M(0xfff3c4, { metalness: 0.3, roughness: 0.25 })); horn.position.set(0, 0.62, 0.38); horn.quaternion.setFromUnitVectors(Z, new V3(0, 0.7, 0.7).normalize()); g.add(horn); }
      face([0, 0.48, 0.05], 0.42, { size: 0.06, gap: 0.15, my: sharky ? -0.12 : -0.09, mood: sharky ? "open" : "smile" }); return sharky ? 0.96 : a === "narwhal" ? 1.1 : 0.9; }
  }
}

// ---- Glow-Up extras: accessories you put on a clean face -------------------
export const GLAM_ACCS = [null, "bow", "crown", "flowers", "star"];
export function addGlam(g, glam) {
  const old = g.getObjectByName("glam"); if (old) g.remove(old); if (!glam) return; const hc = g.userData.hc, hr = g.userData.hr; if (!hc) return;
  const G = new THREE.Group(); G.name = "glam"; g.add(G);
  if (glam.acc === "bow") { const pink = M(0xff5da2, { roughness: 0.3 }); const at = onBall(hc, hr, 0.55, 0.8, 0.02); for (const s of [-1, 1]) { const c = coneOut(hr * 0.2, hr * 0.32, pink); c.position.copy(at); c.quaternion.setFromUnitVectors(Z, new V3(s, 0.25, 0.1).normalize()); G.add(c); } G.add(ball(hr * 0.08, pink, at.x, at.y, at.z)); }
  if (glam.acc === "crown") { const gold = M(0xffc93c, { metalness: 0.9, roughness: 0.2 }); const y = hc[1] + hr * 0.88; G.add(cyl(hr * 0.42, hr * 0.4, hr * 0.18, gold, hc[0], y, hc[2], 20, true)); for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; G.add(cone(hr * 0.07, hr * 0.17, gold, hc[0] + Math.cos(a) * hr * 0.41, y + hr * 0.16, hc[2] + Math.sin(a) * hr * 0.41)); G.add(ball(hr * 0.04, M([0xff3d9a, 0x3d8bfd, 0x2fae66][i % 3], { roughness: 0.1 }), hc[0] + Math.cos(a) * hr * 0.42, y, hc[2] + Math.sin(a) * hr * 0.42)); } }
  if (glam.acc === "flowers") { for (let i = 0; i < 7; i++) { const yaw = -1.3 + i * 0.43, col = [0xff8ac8, 0xffd54a, 0xb18cff, 0xffffff, 0x7ad3ff][i % 5]; const c = onBall(hc, hr, yaw, 0.62 + Math.abs(yaw) * 0.05, 0.01); const fl = new THREE.Group(); fl.position.copy(c); fl.quaternion.setFromUnitVectors(Z, c.clone().sub(new V3(...hc)).normalize()); for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; fl.add(ball(hr * 0.06, M(col, { roughness: 0.5 }), Math.cos(a) * hr * 0.07, Math.sin(a) * hr * 0.07, 0, 1, 1, 0.5)); } fl.add(ball(hr * 0.045, M(0xffc93c), 0, 0, hr * 0.02)); G.add(fl); } }
  if (glam.acc === "star") { for (const s of [-1, 1]) { const st = mesh(star(hr * 0.14, hr * 0.04), M(0xffe066, { emissive: 0xffc93c, emissiveIntensity: 0.4, metalness: 0.4, roughness: 0.25 })); st.position.copy(onBall(hc, hr, s * 0.62, 0.62, 0.02)); st.quaternion.setFromUnitVectors(Z, st.position.clone().sub(new V3(...hc)).normalize()); G.add(st); } }
  if (glam.blush) for (const s of [-1, 1]) { const b = mesh(new THREE.CircleGeometry(hr * 0.13, 18), M(0xff4f8f, { transparent: true, opacity: 0.45, depthWrite: false })); stick(G, b, hc, hr, s * 0.62, -0.17, 0.008); }
  for (const st of glam.stickers || []) { const sp = mesh(new THREE.PlaneGeometry(hr * 0.2, hr * 0.2), new THREE.MeshBasicMaterial({ map: emojiTexture(st.e), transparent: true, depthWrite: false })); stick(G, sp, hc, hr, st.yaw, st.pitch, 0.012); }
}

// ==========================================================================
//  buildItem — the one entry point
// ==========================================================================
export function buildItem(kind, { lod = 1, glam = null } = {}) {
  const k = typeof kind === "string" ? byId(kind) : kind; Q = lod; const g = new THREE.Group(); const rand = rng(hash(k.id)); const p = k.p; let H = 1;
  if (p.kind === "chicken" || p.kind === "rubber") H = buildChicken(p, g, rand);
  else if (k.series === "snacks") H = buildSnack(p, g, rand);
  else if (k.series === "hunters" && p.kind !== "critter") H = buildHunter(p, g, rand);
  else if (k.series === "spuds") H = buildSpud(p, g, rand, k.id);
  else if (p.kind === "dino") H = buildDino(p, g, rand);
  else if (p.kind === "slime") H = buildSlime(p, g, rand);
  else if (p.kind === "sea") H = buildSea(p, g, rand);
  else H = buildCritter(p, g, rand, p.kind === "face");
  applyFinish(g, k.finish, p.kind === "chicken" || p.kind === "rubber");
  if (p.kind === "face" && glam) addGlam(g, glam);
  Q = 1; g.userData.H = H; g.userData.kind = k; return g;
}

// ==========================================================================
//  The blind bag — a crinkly foil pouch with a tear-off top
// ==========================================================================
const BAG_ART = { mega: { name: "MEGA MYSTERY", ico: "🎁", colors: ["#3d8bfd", "#ff5da2"] }, jumbo: { name: "JUMBO GOLD", ico: "🏆", colors: ["#ffc93c", "#ff8a3d"] } };
function bagTexture(sid) {
  const S = SERIES[sid] || BAG_ART[sid] || BAG_ART.mega; const name = (S.name || "").toUpperCase();
  return canvasTex(`bag:${sid}`, 512, 720, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, S.colors[0]); gr.addColorStop(1, S.colors[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${rnd(0.15, 0.4)})`; const x = rnd(0, w), y = rnd(0, h), r = rnd(6, 18); g.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, rr = k % 2 ? r * 0.4 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
    g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.roundRect(30, 96, w - 60, 120, 30); g.fill();
    g.fillStyle = "#3a1f4a"; g.textAlign = "center"; g.textBaseline = "middle"; let fs = 58; g.font = `900 ${fs}px system-ui, sans-serif`; while (g.measureText(name).width > w - 100 && fs > 20) { fs -= 2; g.font = `900 ${fs}px system-ui, sans-serif`; } g.fillText(name, w / 2, 156);
    g.font = '200px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'; g.fillText(S.ico, w / 2, 400);
    g.font = "900 120px system-ui, sans-serif"; g.fillStyle = "rgba(255,255,255,.9)"; g.fillText("?", 90, 330); g.fillText("?", w - 90, 470);
    g.fillStyle = "#fff"; g.beginPath(); g.roundRect(80, 560, w - 160, 70, 35); g.fill(); g.fillStyle = "#ff3d9a"; g.font = "900 40px system-ui, sans-serif"; g.fillText("BLIND BAG!", w / 2, 597);
    g.fillStyle = "rgba(255,255,255,.65)"; for (let x = 0; x < w; x += 24) { g.fillRect(x, 40, 12, 4); } // tear-here dashes
  });
}
export function makeBag(sid) {
  const g = new THREE.Group(); const tex = bagTexture(sid);
  const foil = (top) => new THREE.MeshPhysicalMaterial({ map: tex, metalness: 0.45, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15, side: THREE.DoubleSide });
  const W = 1.0, Hh = 1.4, cut = 0.86; // the top 14% tears off
  const piece = (v0, v1) => { const geo = new THREE.PlaneGeometry(W, Hh * (v1 - v0), 24, 20); const pa = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < pa.count; i++) { const u = uv.getX(i), vv = v0 + uv.getY(i) * (v1 - v0); uv.setY(i, vv); pa.setY(i, vv * Hh); const bul = 0.17 * Math.pow(Math.sin(Math.PI * u), 0.7) * Math.pow(Math.sin(Math.PI * Math.min(1, vv * 1.02)), 0.6); pa.setZ(i, bul + 0.008 * Math.sin(u * 40 + vv * 30)); } geo.computeVertexNormals(); const front = new THREE.Mesh(geo, foil()); const back = new THREE.Mesh(geo.clone(), new THREE.MeshPhysicalMaterial({ color: new THREE.Color((SERIES[sid] || BAG_ART[sid] || BAG_ART.mega).colors[1]), metalness: 0.5, roughness: 0.3, clearcoat: 1, side: THREE.DoubleSide })); back.scale.z = -1; const grp = new THREE.Group(); grp.add(front, back); return grp; };
  const body = piece(0, cut); g.add(body);
  const crimpM = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.3 });
  const crimp = (y) => { const c = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, 0.03, 30, 1, 1), crimpM); const pa = c.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, pa.getZ(i) + 0.01 * Math.sin(pa.getX(i) * 90)); c.position.y = y; return c; };
  body.add(crimp(0.03));
  const top = new THREE.Group(); top.position.y = Hh * cut; const tp = piece(cut, 1); tp.position.y = -Hh * cut; top.add(tp); top.add(crimp(Hh * (1 - cut) - 0.03)); g.add(top);
  g.userData = { body, top, W, H: Hh, cutY: Hh * cut };
  return g;
}
