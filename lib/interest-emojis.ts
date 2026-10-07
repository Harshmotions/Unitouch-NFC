/* Interest tag dictionary for the profile studio: one emoji per interest.

   Format, one per line:  emoji | Label | extra keywords (comma separated)
   The label itself (lowercased) is always a keyword too. Matching (see
   lib/interests.ts) is whole-word with common endings allowed (s, es, ing,
   ed, er, ers, ist, ists, y), so "cook" also matches "cooking"/"cooks" and
   "photograph" matches "photography"/"photographer". Keep keywords specific:
   short or ambiguous words cause wrong suggestions.

   Labels that existed before this list (e.g. "Engineering", "Branding",
   "UI Design") keep their exact emoji + label so tags already saved on
   published profiles stay identical. Tags are capped at 30 characters by
   the profile schema, so keep labels short. */

const RAW = `
💻 | Engineering | coding, coder, programming, programmer, developer, software, software engineer, code
🌐 | Web Development | web dev, web developer, frontend, front end, backend, back end, full stack, fullstack, website
📱 | App Development | app dev, app developer, mobile app, ios, android, flutter, react native
🤖 | AI | artificial intelligence, machine learning, deep learning, chatgpt, llm, genai, generative ai
📊 | Data Science | data scientist, data analytics, data analyst, analytics, big data, data
🔐 | Cybersecurity | cyber security, infosec, ethical hacking, hacking, security
☁️ | Cloud | aws, azure, gcp, devops, cloud computing
⛓️ | Blockchain | web3, crypto, cryptocurrency, bitcoin, ethereum, nft
🦾 | Robotics | robot, automation
🔌 | Electronics | electronic, circuit, arduino, embedded
📡 | IoT | internet of things, smart home
🖥️ | Hardware | computer, pc building
💡 | Tech | technology, innovation
🧭 | Product Management | product manager, product management, product design
💻 | UI Design | ui design, ux design, ui/ux, ui ux, user interface
🔍 | UX Research | user research, ux research, usability
🖌️ | Graphic Design | graphic designer, graphics, poster design
🎨 | Design | designer
🎨 | Branding | brand, brand identity, brand strategy
📈 | Marketing | marketer, growth hacking
📣 | Digital Marketing | performance marketing, paid ads, google ads, facebook ads, meta ads
🔎 | SEO | search engine optimization
📲 | Social Media | social media marketing, smm
🎥 | Content Creation | content creator, creator, content, ugc
📺 | Advertising | ads, advert, ad agency
📰 | Journalism | journalist, reporter, reporting
🗞️ | News | current affairs
🤝 | Sales | selling, business development, bd
💼 | Business | business owner, businessman, businesswoman, smb, sme
🚀 | Startups | startup, entrepreneur, entrepreneurship, founder, cofounder, co-founder
🧑‍💼 | Leadership | leader, ceo, executive, cxo
📋 | Management | manager, project management, project manager
🎯 | Strategy | strategist, planning
📊 | Consulting | consultant, advisory
💰 | Finance | financial, fintech, wealth
💹 | Investing | investor, investment, stock market, stocks, trading, trader, mutual funds
🏦 | Banking | banker, bank
🧾 | Accounting | accountant, chartered accountant, ca, tax, taxation, gst, audit, bookkeeping
📉 | Economics | economist, economy
🛡️ | Insurance | insurer
🏠 | Real Estate | realtor, property, properties, real estate agent
🛒 | E-commerce | ecommerce, online store, shopify, d2c, dtc
🏪 | Retail | store, shop owner
🚚 | Logistics | shipping, delivery, courier, transport
📦 | Supply Chain | procurement, warehouse, inventory
🏭 | Manufacturing | factory, production, industrial
🚢 | Import Export | import export, importer, exporter, exim
👥 | HR | human resources, recruiting, recruiter, recruitment, hiring, talent acquisition
💬 | Customer Success | customer support, customer service, cx
⚙️ | Operations | ops
🔗 | Networking | network, meeting people
🎤 | Public Speaking | public speaking, speaker, keynote, ted talk, emcee, anchor
🧑‍🏫 | Coaching | coach, life coach, business coach
🌱 | Mentoring | mentor, mentorship
📚 | Education | teaching, teacher, tutor, tutoring, edtech, professor, lecturer, school
🔬 | Research | researcher, phd, academia
🧪 | Science | scientist
⚛️ | Physics | physicist, quantum
⚗️ | Chemistry | chemist
🧬 | Biology | biologist, biotech, genetics
🧮 | Mathematics | math, maths, mathematician, statistics
🔭 | Astronomy | astronomer, stargazing, astrophysics
🪐 | Space | space exploration, isro, nasa, spacex, cosmos
🌍 | Environment | environmental, ecology, nature conservation, conservation
♻️ | Sustainability | sustainable, eco friendly, recycling, zero waste
🌡️ | Climate | climate change, climate action
🔆 | Renewable Energy | solar, solar energy, wind energy, renewables, clean energy, ev, electric vehicle
🌾 | Agriculture | agritech, agri
🚜 | Farming | farmer, farm
🪴 | Gardening | gardener, plants, houseplants, garden
⚖️ | Law | legal, lawyer, advocate, attorney, litigation, corporate law
🗳️ | Politics | political, policy, governance, public policy
🏛️ | Architecture | architect, architectural
🤲 | Social Work | social worker, ngo, social impact
💚 | Nonprofit | non profit, non-profit, charity, foundation
🙌 | Volunteering | volunteer
🫶 | Community | community building, community manager
🏥 | Healthcare | hospital, healthtech, health tech
💊 | Medicine | doctor, physician, medical, mbbs, surgeon
🩺 | Health | wellness, wellbeing, well being, nurse, nursing
🧠 | Mental Health | therapy, therapist, counselling, counseling, mindfulness
💭 | Psychology | psychologist
🦷 | Dentistry | dentist, dental
⚕️ | Pharmacy | pharmacist, pharma, pharmaceutical
🥗 | Nutrition | nutritionist, dietitian, diet, healthy eating
💪 | Fitness | gym, workout, fitness trainer, personal trainer, exercise, crossfit
🏋️ | Bodybuilding | bodybuilder, weightlifting, powerlifting, lifting
🧘 | Yoga | yogi, pilates
🪷 | Meditation | meditate, breathwork
🏃 | Running | runner, marathon, jogging, jog
🚴 | Cycling | cyclist, bicycle, biking
🏊 | Swimming | swimmer, swim
🥾 | Hiking | hiker, hike
🏔️ | Trekking | trek, trekker, himalayas, himalaya
🏕️ | Camping | camp, camper
🧗 | Climbing | climber, bouldering, rock climbing
⛷️ | Skiing | ski, snowboard, snowboarding
🏄 | Surfing | surf, surfer
🛹 | Skateboarding | skate, skater, skateboard
⚽ | Football | soccer, footballer
🏏 | Cricket | cricketer, ipl
🏀 | Basketball | nba
🎾 | Tennis | tennis player
🏸 | Badminton | shuttle
🏓 | Table Tennis | ping pong, table tennis
🏐 | Volleyball | volleyball
⚾ | Baseball | baseball
🏉 | Rugby | rugby
⛳ | Golf | golfer, golfing
🥊 | Boxing | boxer, kickboxing
🥋 | Martial Arts | karate, judo, taekwondo, mma, kung fu, jiu jitsu, bjj
🤼 | Wrestling | wrestler, kabaddi
♟️ | Chess | chess player
🎳 | Bowling | bowling
🏹 | Archery | archer
🎣 | Fishing | fisherman, angling
🏇 | Horse Riding | equestrian, horse riding
🏎️ | Motorsports | f1, formula 1, formula one, racing, motorsport, karting
🚗 | Cars | car, automobile, automotive, car enthusiast
🏍️ | Motorcycles | motorcycle, motorbike, superbike, biker, royal enfield
🛩️ | Aviation | pilot, aircraft, flying, airline
⛵ | Sailing | sailor, sail, boating, yacht
🤿 | Scuba Diving | scuba, diving, diver, snorkeling, snorkelling
💃 | Dance | dancer, dancing, choreography, choreographer, salsa, hip hop dance
🎵 | Music | musician, songs
🎶 | Singing | singer, vocalist, vocals
🎸 | Guitar | guitarist
🎹 | Piano | pianist, keyboard player
🥁 | Drums | drummer
🎻 | Violin | violinist
🎺 | Trumpet | trumpeter
🎷 | Saxophone | saxophonist, sax
🎧 | DJ | djing, deejay
🎚️ | Music Production | music producer, producer, beat making, beats, mixing, mastering
🎙️ | Podcasting | podcast, podcaster
📻 | Radio | rj, radio jockey
🎭 | Theatre | theater, acting, actor, actress, drama
😂 | Comedy | comedian, stand up, standup, humor, humour
🎬 | Film | filmmaking, filmmaker, cinema, movies, movie, director, cinematography
🎞️ | Video Editing | video editor, editing, premiere pro, after effects, davinci
📽️ | Animation | animator, animated, motion graphics, motion design
📷 | Photography | photograph, photo, photos
📹 | Videography | videographer, video
🚁 | Drones | drone, fpv
🪄 | VFX | visual effects, cgi
🧊 | 3D Design | 3d, blender, 3d modeling, 3d modelling, cad
🎮 | Gaming | gamer, video games, games
🕹️ | Esports | e-sports, competitive gaming
👾 | Game Development | game dev, game developer, game design, unity, unreal
🔴 | Live Streaming | streamer, streaming, twitch
▶️ | YouTube | youtuber, youtube creator
📸 | Instagram | instagrammer, reels
✨ | Influencer | influencer marketing, creator economy
📝 | Blogging | blogger, blog
✍️ | Writing | writer, copywriting, copywriter, author, storytelling, screenwriting
🪶 | Poetry | poet, poems, shayari
📖 | Reading | reader, books, book, bookworm, book club
🗣️ | Languages | language, linguistics, translation, translator, polyglot
📜 | History | historian, heritage
🤔 | Philosophy | philosopher
🙏 | Spirituality | spiritual, faith, devotion
🔮 | Astrology | tarot, numerology
🖼️ | Painting | painter, paint, watercolor, watercolour, acrylic
✏️ | Drawing | sketch, sketching, sketches, doodling, doodle
🎨 | Art | artist, illustration, illustrator, fine arts, digital art
🖋️ | Calligraphy | lettering, hand lettering, typography
🗿 | Sculpture | sculptor, sculpting
🏺 | Pottery | potter, ceramics, clay
🧶 | Crafts | crafting, knitting, crochet, handmade, art and craft
🧵 | Sewing | tailoring, embroidery, stitching
🛠️ | DIY | do it yourself, maker
🪚 | Woodworking | carpentry, carpenter, woodwork
🛋️ | Interior Design | interiors, interior designer, home decor, decor
👗 | Fashion | fashion designer, clothing, apparel
👔 | Styling | stylist, personal styling, menswear
💄 | Makeup | makeup artist, mua, cosmetics
💅 | Beauty | beauty, nails, salon
🧴 | Skincare | skin care, skin
💇 | Hair | hairstylist, hair stylist, barber, hairdresser
💍 | Jewellery | jewelry, jeweller, jeweler
⌚ | Watches | watch collector, horology
👟 | Sneakers | sneakerhead, shoes, footwear
💎 | Luxury | luxury brands
🛍️ | Shopping | shopper
🍳 | Food | cooking, cook, chef, foodie, cuisine, recipes, culinary
🧁 | Baking | baker, bakery, cakes, cake, pastry, desserts
☕ | Coffee | barista, cafe, cafes, espresso
🍵 | Tea | chai
🍷 | Wine | sommelier, wines
🍺 | Craft Beer | beer, brewing, brewery
🍸 | Cocktails | mixology, bartender, mixologist
🌮 | Street Food | street food
🍕 | Pizza | pizza
🍣 | Sushi | sushi, japanese food
🥦 | Vegan | veganism, vegetarian, plant based
🍽️ | Restaurants | restaurant, restaurateur, dining, fine dining
🏨 | Hospitality | hotel, hotels, hotelier, hospitality
🎉 | Events | event, event management, event planner, parties, party planning
💒 | Weddings | wedding, wedding planner, wedding photography
🪔 | Festivals | festival, diwali, celebrations
✈️ | Travel | traveling, travelling, traveler, traveller, wanderlust, tourism
🎒 | Backpacking | backpacker, solo travel
🛣️ | Road Trips | road trip, roadtrips, driving
🏖️ | Beaches | beach, beach life
⛰️ | Mountains | mountain, hills
🌿 | Nature | outdoors, outdoor, forest, nature lover
🦁 | Wildlife | wildlife photography, safari, jungle
🐾 | Animals | animal, animal welfare, animal rescue
🐶 | Dogs | dog, puppy, puppies, dog lover
🐱 | Cats | cat, kitten, cat lover
🐴 | Horses | horse
🐦 | Birdwatching | birding, birds, bird
🌊 | Ocean | sea, marine, marine biology
🧘‍♀️ | Self Care | self-care, selfcare, me time
🌻 | Personal Growth | self improvement, self-improvement, personal development, growth mindset
⏱️ | Productivity | productive, time management, habits
🔥 | Motivation | motivational, motivator, inspiration, inspiring
⚪ | Minimalism | minimalist, minimal living
💸 | Personal Finance | budgeting, saving money, frugal
🏡 | Remote Work | remote, work from home, wfh, digital nomad
🧑‍💻 | Freelancing | freelancer, freelance, independent consultant
🏢 | Agency | agency owner, creative agency
👨‍👩‍👧 | Family | family man, family woman
🍼 | Parenting | parent, mom, mother, dad, father, motherhood, fatherhood
💑 | Relationships | dating, marriage
🍿 | Bollywood | hindi movies, hindi cinema
🍥 | Anime | manga, otaku
🦸 | Comics | comic books, superheroes, superhero, marvel, dc
🎲 | Board Games | board game, tabletop
🃏 | Card Games | poker, rummy, card game
🧩 | Puzzles | puzzle, sudoku, rubiks cube, crosswords
🎩 | Magic | magician, illusionist
🧱 | LEGO | lego
🚆 | Trains | train, railways, railway
🗺️ | Exploring | explorer, exploration, adventure, adventures
📺 | TV Shows | tv, tv series, web series, binge watching, netflix
🎟️ | Concerts | concert, live music, gigs
🏟️ | Sports | sport, athlete, athletics, sportsman, sports fan
🏆 | Competitions | competitive, hackathon, hackathons
🎓 | Learning | lifelong learning, learner, courses, students, student
🧑‍🔬 | Innovation | innovator, inventor, invention, r&d
🌟 | Personal Branding | personal brand, thought leadership
📅 | Meetups | meetup, event hosting
💌 | Email Marketing | newsletter, newsletters, email marketing
🛰️ | Satellites | satellite, aerospace, aeronautics, aerospace engineering
🏗️ | Construction | civil engineering, civil engineer, contractor, builder, infrastructure
⚡ | Electrical | electrical engineering, electrician
🔧 | Mechanical | mechanical engineering, mechanic, automobile engineering
🧑‍🍳 | Home Cooking | home chef, home cook
🍫 | Chocolate | chocolatier, chocolates
🍦 | Ice Cream | gelato
🍜 | Asian Food | ramen, noodles, chinese food, thai food
🥘 | Indian Food | indian cuisine, biryani, curry
🫖 | Tea Tasting | tea tasting
🎨 | Creativity | creative, creatives
`;

export interface InterestEntry {
  emoji: string;
  label: string;
  tag: string; // "emoji Label", what gets saved on the profile
  keywords: string[]; // lowercase
}

export const INTEREST_DICTIONARY: InterestEntry[] = RAW.trim()
  .split("\n")
  .map((line) => line.split("|").map((part) => part.trim()))
  .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
  .map(([emoji, label, extra = ""]) => ({
    emoji,
    label,
    tag: `${emoji} ${label}`,
    keywords: Array.from(
      new Set([label.toLowerCase(), ...extra.split(",").map((k) => k.trim().toLowerCase())].filter(Boolean)),
    ),
  }));

/* Shown as quick picks before the customer types anything. */
export const POPULAR_INTEREST_LABELS = [
  "Startups",
  "Design",
  "Marketing",
  "Engineering",
  "AI",
  "Photography",
  "Travel",
  "Fitness",
  "Music",
  "Coffee",
  "Food",
  "Reading",
  "Cricket",
  "Gaming",
  "Film",
  "Finance",
  "Yoga",
  "Public Speaking",
];
