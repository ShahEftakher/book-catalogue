// Adds ~150 sample books (tagged "sample") so the 3D library's scale is easy to judge:
//   pnpm db:seed:dummy            add them
//   pnpm db:seed:dummy --remove   delete every book tagged "sample" (your real books stay)
import { config } from "dotenv";

config({ path: ".env.local" });

const TAG = "sample";

const BANGLA: [string, string, string][] = [
  ["দেবদাস", "শরৎচন্দ্র চট্টোপাধ্যায়", "Sharatchandra Chattopadhyay"],
  ["শ্রীকান্ত", "শরৎচন্দ্র চট্টোপাধ্যায়", "Sharatchandra Chattopadhyay"],
  ["গৃহদাহ", "শরৎচন্দ্র চট্টোপাধ্যায়", "Sharatchandra Chattopadhyay"],
  ["পরিণীতা", "শরৎচন্দ্র চট্টোপাধ্যায়", "Sharatchandra Chattopadhyay"],
  ["গীতাঞ্জলি", "রবীন্দ্রনাথ ঠাকুর", "Rabindranath Tagore"],
  ["শেষের কবিতা", "রবীন্দ্রনাথ ঠাকুর", "Rabindranath Tagore"],
  ["চোখের বালি", "রবীন্দ্রনাথ ঠাকুর", "Rabindranath Tagore"],
  ["গোরা", "রবীন্দ্রনাথ ঠাকুর", "Rabindranath Tagore"],
  ["ঘরে বাইরে", "রবীন্দ্রনাথ ঠাকুর", "Rabindranath Tagore"],
  ["নৌকাডুবি", "রবীন্দ্রনাথ ঠাকুর", "Rabindranath Tagore"],
  ["অপরাজিত", "বিভূতিভূষণ বন্দ্যোপাধ্যায়", "Bibhutibhushan Bandyopadhyay"],
  ["আরণ্যক", "বিভূতিভূষণ বন্দ্যোপাধ্যায়", "Bibhutibhushan Bandyopadhyay"],
  ["চাঁদের পাহাড়", "বিভূতিভূষণ বন্দ্যোপাধ্যায়", "Bibhutibhushan Bandyopadhyay"],
  ["আদর্শ হিন্দু হোটেল", "বিভূতিভূষণ বন্দ্যোপাধ্যায়", "Bibhutibhushan Bandyopadhyay"],
  ["কপালকুণ্ডলা", "বঙ্কিমচন্দ্র চট্টোপাধ্যায়", "Bankim Chandra Chattopadhyay"],
  ["দুর্গেশনন্দিনী", "বঙ্কিমচন্দ্র চট্টোপাধ্যায়", "Bankim Chandra Chattopadhyay"],
  ["আনন্দমঠ", "বঙ্কিমচন্দ্র চট্টোপাধ্যায়", "Bankim Chandra Chattopadhyay"],
  ["পদ্মা নদীর মাঝি", "মানিক বন্দ্যোপাধ্যায়", "Manik Bandopadhyay"],
  ["পুতুলনাচের ইতিকথা", "মানিক বন্দ্যোপাধ্যায়", "Manik Bandopadhyay"],
  ["লালসালু", "সৈয়দ ওয়ালীউল্লাহ", "Syed Waliullah"],
  ["চাঁদের অমাবস্যা", "সৈয়দ ওয়ালীউল্লাহ", "Syed Waliullah"],
  ["হাজার বছর ধরে", "জহির রায়হান", "Zahir Raihan"],
  ["আরেক ফাল্গুন", "জহির রায়হান", "Zahir Raihan"],
  ["তিতাস একটি নদীর নাম", "অদ্বৈত মল্লবর্মণ", "Advaita Mallabarman"],
  ["কবি", "তারাশঙ্কর বন্দ্যোপাধ্যায়", "Tarashankar Bandyopadhyay"],
  ["হাঁসুলী বাঁকের উপকথা", "তারাশঙ্কর বন্দ্যোপাধ্যায়", "Tarashankar Bandyopadhyay"],
  ["নন্দিত নরকে", "হুমায়ূন আহমেদ", "Humayun Ahmed"],
  ["শঙ্খনীল কারাগার", "হুমায়ূন আহমেদ", "Humayun Ahmed"],
  ["মিসির আলি", "হুমায়ূন আহমেদ", "Humayun Ahmed"],
  ["দেয়াল", "হুমায়ূন আহমেদ", "Humayun Ahmed"],
  ["জোছনা ও জননীর গল্প", "হুমায়ূন আহমেদ", "Humayun Ahmed"],
  ["ময়ূরাক্ষী", "হুমায়ূন আহমেদ", "Humayun Ahmed"],
  ["দরজার ওপাশে", "হুমায়ূন আহমেদ", "Humayun Ahmed"],
  ["বৃহন্নলা", "হুমায়ূন আহমেদ", "Humayun Ahmed"],
  ["ফেলুদা সমগ্র", "সত্যজিৎ রায়", "Satyajit Ray"],
  ["প্রোফেসর শঙ্কু", "সত্যজিৎ রায়", "Satyajit Ray"],
  ["ব্যোমকেশ সমগ্র", "শরদিন্দু বন্দ্যোপাধ্যায়", "Sharadindu Bandyopadhyay"],
  ["পার্থিব", "শীর্ষেন্দু মুখোপাধ্যায়", "Shirshendu Mukhopadhyay"],
  ["দূরবীন", "শীর্ষেন্দু মুখোপাধ্যায়", "Shirshendu Mukhopadhyay"],
  ["প্রথম আলো", "সুনীল গঙ্গোপাধ্যায়", "Sunil Gangopadhyay"],
  ["সেই সময়", "সুনীল গঙ্গোপাধ্যায়", "Sunil Gangopadhyay"],
  ["পূর্ব-পশ্চিম", "সুনীল গঙ্গোপাধ্যায়", "Sunil Gangopadhyay"],
  ["খোয়াবনামা", "আখতারুজ্জামান ইলিয়াস", "Akhteruzzaman Elias"],
  ["চিলেকোঠার সেপাই", "আখতারুজ্জামান ইলিয়াস", "Akhteruzzaman Elias"],
  ["একাত্তরের দিনগুলি", "জাহানারা ইমাম", "Jahanara Imam"],
  ["আমার বন্ধু রাশেদ", "মুহম্মদ জাফর ইকবাল", "Muhammed Zafar Iqbal"],
  ["দীপু নাম্বার টু", "মুহম্মদ জাফর ইকবাল", "Muhammed Zafar Iqbal"],
  ["সাতকাহন", "সমরেশ মজুমদার", "Samaresh Majumdar"],
  ["উত্তরাধিকার", "সমরেশ মজুমদার", "Samaresh Majumdar"],
  ["অগ্নিবীণা", "কাজী নজরুল ইসলাম", "Kazi Nazrul Islam"],
  ["বিষের বাঁশী", "কাজী নজরুল ইসলাম", "Kazi Nazrul Islam"],
  ["রূপসী বাংলা", "জীবনানন্দ দাশ", "Jibanananda Das"],
  ["বনলতা সেন", "জীবনানন্দ দাশ", "Jibanananda Das"],
  ["ঠাকুরমার ঝুলি", "দক্ষিণারঞ্জন মিত্র মজুমদার", "Dakshinaranjan Mitra Majumder"],
  ["পাক সার জমিন সাদ বাদ", "হুমায়ুন আজাদ", "Humayun Azad"],
];

const ENGLISH: [string, string][] = [
  ["Pride and Prejudice", "Jane Austen"],
  ["Emma", "Jane Austen"],
  ["Persuasion", "Jane Austen"],
  ["Jane Eyre", "Charlotte Brontë"],
  ["Wuthering Heights", "Emily Brontë"],
  ["Great Expectations", "Charles Dickens"],
  ["A Tale of Two Cities", "Charles Dickens"],
  ["Bleak House", "Charles Dickens"],
  ["Middlemarch", "George Eliot"],
  ["Moby-Dick", "Herman Melville"],
  ["The Great Gatsby", "F. Scott Fitzgerald"],
  ["To the Lighthouse", "Virginia Woolf"],
  ["Mrs Dalloway", "Virginia Woolf"],
  ["Ulysses", "James Joyce"],
  ["Animal Farm", "George Orwell"],
  ["Brave New World", "Aldous Huxley"],
  ["Fahrenheit 451", "Ray Bradbury"],
  ["The Catcher in the Rye", "J. D. Salinger"],
  ["To Kill a Mockingbird", "Harper Lee"],
  ["One Hundred Years of Solitude", "Gabriel García Márquez"],
  ["Love in the Time of Cholera", "Gabriel García Márquez"],
  ["Crime and Punishment", "Fyodor Dostoevsky"],
  ["The Brothers Karamazov", "Fyodor Dostoevsky"],
  ["Anna Karenina", "Leo Tolstoy"],
  ["War and Peace", "Leo Tolstoy"],
  ["The Trial", "Franz Kafka"],
  ["The Stranger", "Albert Camus"],
  ["The Old Man and the Sea", "Ernest Hemingway"],
  ["Beloved", "Toni Morrison"],
  ["Things Fall Apart", "Chinua Achebe"],
  ["Midnight's Children", "Salman Rushdie"],
  ["The God of Small Things", "Arundhati Roy"],
  ["A Suitable Boy", "Vikram Seth"],
  ["The Remains of the Day", "Kazuo Ishiguro"],
  ["Never Let Me Go", "Kazuo Ishiguro"],
  ["Norwegian Wood", "Haruki Murakami"],
  ["Kafka on the Shore", "Haruki Murakami"],
  ["The Name of the Rose", "Umberto Eco"],
  ["The Little Prince", "Antoine de Saint-Exupéry"],
  ["Dune", "Frank Herbert"],
  ["Foundation", "Isaac Asimov"],
  ["The Left Hand of Darkness", "Ursula K. Le Guin"],
  ["A Wizard of Earthsea", "Ursula K. Le Guin"],
  ["The Fellowship of the Ring", "J.R.R. Tolkien"],
  ["The Two Towers", "J.R.R. Tolkien"],
  ["The Return of the King", "J.R.R. Tolkien"],
  ["Neuromancer", "William Gibson"],
  ["The Hitchhiker's Guide to the Galaxy", "Douglas Adams"],
  ["Project Hail Mary", "Andy Weir"],
  ["The Martian", "Andy Weir"],
  ["Circe", "Madeline Miller"],
  ["The Song of Achilles", "Madeline Miller"],
  ["The Midnight Library", "Matt Haig"],
  ["Normal People", "Sally Rooney"],
  ["Educated", "Tara Westover"],
  ["Thinking, Fast and Slow", "Daniel Kahneman"],
  ["Atomic Habits", "James Clear"],
  ["A Brief History of Time", "Stephen Hawking"],
  ["Cosmos", "Carl Sagan"],
  ["The Selfish Gene", "Richard Dawkins"],
  ["Guns, Germs, and Steel", "Jared Diamond"],
  ["The Code Breaker", "Walter Isaacson"],
  ["Meditations", "Marcus Aurelius"],
  ["The Republic", "Plato"],
  ["The Art of War", "Sun Tzu"],
  ["Siddhartha", "Hermann Hesse"],
  ["Steppenwolf", "Hermann Hesse"],
  ["The Prophet", "Kahlil Gibran"],
  ["Gitanjali (English)", "Rabindranath Tagore"],
  ["The Name of the Wind", "Patrick Rothfuss"],
  ["The Shadow of the Wind", "Carlos Ruiz Zafón"],
  ["Life of Pi", "Yann Martel"],
  ["The Kite Runner", "Khaled Hosseini"],
  ["A Thousand Splendid Suns", "Khaled Hosseini"],
  ["The Book Thief", "Markus Zusak"],
  ["Sapiens: Volume 2", "Yuval Noah Harari"],
  ["Homo Deus", "Yuval Noah Harari"],
  ["21 Lessons for the 21st Century", "Yuval Noah Harari"],
  ["The Silent Patient", "Alex Michaelides"],
  ["Gone Girl", "Gillian Flynn"],
  ["The Hound of the Baskervilles", "Arthur Conan Doyle"],
  ["Murder on the Orient Express", "Agatha Christie"],
  ["And Then There Were None", "Agatha Christie"],
  ["The Count of Monte Cristo", "Alexandre Dumas"],
  ["Les Misérables", "Victor Hugo"],
  ["Don Quixote", "Miguel de Cervantes"],
  ["The Odyssey", "Homer"],
  ["Frankenstein", "Mary Shelley"],
  ["Dracula", "Bram Stoker"],
  ["The Picture of Dorian Gray", "Oscar Wilde"],
  ["Lolita", "Vladimir Nabokov"],
  ["Slaughterhouse-Five", "Kurt Vonnegut"],
  ["Catch-22", "Joseph Heller"],
  ["The Road", "Cormac McCarthy"],
  ["Rebecca", "Daphne du Maurier"],
];

const STATUSES = ["want_to_read", "reading", "read", "read", "read", "abandoned"] as const;
const FORMATS = [["paperback"], ["hardcover"], ["paperback", "kindle"], ["kindle"], ["ebook"], ["audiobook"]] as const;
const PUBLISHERS_BN = ["অন্যপ্রকাশ", "প্রথমা প্রকাশন", "আনন্দ পাবলিশার্স", "সময় প্রকাশন", "মাওলা ব্রাদার্স"];
const PUBLISHERS_EN = ["Penguin", "Vintage", "Harper", "Picador", "Faber & Faber", "Bloomsbury"];

// Deterministic so re-running gives the same "library"
let seed = 1234;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];

async function main() {
  const { db } = await import("@/db");
  const { books, bookTags, tags } = await import("@/db/schema");
  const { saveBook } = await import("@/lib/books");
  const { emptyBookForm } = await import("@/lib/book-form");
  const { bookInput } = await import("@/lib/validation/book");
  const { eq, inArray } = await import("drizzle-orm");

  const sampleIds = async () =>
    (
      await db
        .select({ id: bookTags.bookId })
        .from(bookTags)
        .innerJoin(tags, eq(tags.id, bookTags.tagId))
        .where(eq(tags.name, TAG))
    ).map((r) => r.id);

  if (process.argv.includes("--remove")) {
    const ids = await sampleIds();
    if (ids.length) await db.delete(books).where(inArray(books.id, ids));
    console.log(`Removed ${ids.length} sample books.`);
    await db.$client.end();
    return;
  }

  const existing = await sampleIds();
  if (existing.length) {
    console.log(`${existing.length} sample books are already there. Run with --remove first to recreate them.`);
    await db.$client.end();
    return;
  }

  const entries = [
    ...BANGLA.map(([title, author, authorLatin]) => ({ title, author, authorLatin, language: "bn" })),
    ...ENGLISH.map(([title, author]) => ({ title, author, authorLatin: "", language: "en" })),
  ].sort(() => rand() - 0.5);

  let added = 0;
  for (const e of entries) {
    const status = pick(STATUSES);
    const rated = status === "read" && rand() < 0.8;
    const data = bookInput.parse({
      ...emptyBookForm(),
      title: e.title,
      authors: [{ name: e.author, nameLatin: e.authorLatin }],
      language: e.language,
      publisherName: e.language === "bn" ? pick(PUBLISHERS_BN) : pick(PUBLISHERS_EN),
      publishedYear: String(1880 + Math.floor(rand() * 145)),
      pages: String(120 + Math.floor(rand() * 700)),
      formats: [...pick(FORMATS)],
      status,
      rating: rated ? Math.round((2.5 + rand() * 2.5) * 2) / 2 : undefined,
      tags: [TAG, e.language === "bn" ? "bangla" : "english"],
      source: "import",
    });
    try {
      await saveBook(data);
      added++;
    } catch (err) {
      console.warn(`Skipped ${e.title}: ${(err as Error).message}`);
    }
  }
  console.log(`Added ${added} sample books (tagged "${TAG}").`);
  await db.$client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
