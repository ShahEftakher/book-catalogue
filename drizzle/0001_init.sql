CREATE TYPE "public"."book_format" AS ENUM('hardcover', 'paperback', 'ebook', 'kindle', 'audiobook');--> statement-breakpoint
CREATE TYPE "public"."book_source" AS ENUM('openlibrary', 'google', 'photo', 'manual', 'import');--> statement-breakpoint
CREATE TYPE "public"."reading_status" AS ENUM('want_to_read', 'reading', 'read', 'abandoned');--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_latin" text
);
--> statement-breakpoint
CREATE TABLE "book_authors" (
	"book_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "book_authors_book_id_author_id_pk" PRIMARY KEY("book_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "book_tags" (
	"book_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "book_tags_book_id_tag_id_pk" PRIMARY KEY("book_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"isbn13" text,
	"isbn10" text,
	"asin" text,
	"title" text NOT NULL,
	"title_latin" text,
	"subtitle" text,
	"publisher_id" uuid,
	"published_year" integer,
	"edition" text,
	"pages" integer,
	"language" text DEFAULT 'en' NOT NULL,
	"description" text,
	"cover_url" text,
	"formats" "book_format"[] DEFAULT ARRAY['paperback']::book_format[] NOT NULL,
	"location" text,
	"copies" integer DEFAULT 1 NOT NULL,
	"source" "book_source" DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"borrower_name" text NOT NULL,
	"borrower_contact" text,
	"lent_at" date DEFAULT now() NOT NULL,
	"due_at" date,
	"returned_at" date,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_latin" text
);
--> statement-breakpoint
CREATE TABLE "reading" (
	"book_id" uuid PRIMARY KEY NOT NULL,
	"status" "reading_status" DEFAULT 'want_to_read' NOT NULL,
	"started_at" date,
	"finished_at" date,
	"rating" numeric(2, 1),
	"review_public" text,
	"notes_private" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_tags" ADD CONSTRAINT "book_tags_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_tags" ADD CONSTRAINT "book_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading" ADD CONSTRAINT "reading_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "authors_name_uq" ON "authors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "authors_name_trgm" ON "authors" USING gin (lower("name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "authors_name_latin_trgm" ON "authors" USING gin (lower("name_latin") gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "books_isbn13_uq" ON "books" USING btree ("isbn13");--> statement-breakpoint
CREATE UNIQUE INDEX "books_asin_uq" ON "books" USING btree ("asin");--> statement-breakpoint
CREATE INDEX "books_title_trgm" ON "books" USING gin (lower("title") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "books_title_latin_trgm" ON "books" USING gin (lower("title_latin") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "loans_book_idx" ON "loans" USING btree ("book_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publishers_name_uq" ON "publishers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_uq" ON "tags" USING btree ("name");