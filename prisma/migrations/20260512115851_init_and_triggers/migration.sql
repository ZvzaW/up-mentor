-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "surname" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "password" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,

    CONSTRAINT "user_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer" (
    "id" UUID NOT NULL,
    "work_description" TEXT,
    "price_per_training" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "slug" TEXT NOT NULL,

    CONSTRAINT "trainer_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainee" (
    "id" UUID NOT NULL,
    "birthdate" DATE NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "trainee_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_request" (
    "trainer_id" UUID NOT NULL,
    "trainee_id" UUID NOT NULL,
    "workplace_id" UUID NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(10) NOT NULL DEFAULT 'pending',

    CONSTRAINT "coaching_request_pk" PRIMARY KEY ("trainer_id","trainee_id")
);

-- CreateTable
CREATE TABLE "cooperation" (
    "trainer_id" UUID NOT NULL,
    "trainee_id" UUID NOT NULL,
    "workplace_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainer_note" TEXT,
    "status" VARCHAR(10) NOT NULL DEFAULT 'active',

    CONSTRAINT "cooperation_pk" PRIMARY KEY ("trainer_id","trainee_id")
);

-- CreateTable
CREATE TABLE "workplace" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "street" VARCHAR(120) NOT NULL,
    "building_number" VARCHAR(20) NOT NULL,
    "flat_number" VARCHAR(20),
    "city" VARCHAR(120) NOT NULL,

    CONSTRAINT "workplace_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "difficulty" VARCHAR(100),
    "description" TEXT,
    "trainee_id" UUID,

    CONSTRAINT "workout_plan_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_plan_id" UUID NOT NULL,
    "name" VARCHAR(255),
    "body_part" VARCHAR(100),
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "section_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_set" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exercise_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "series_count" INTEGER NOT NULL,
    "reps_count" INTEGER NOT NULL,
    "weight" DECIMAL(5,2),
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "exercise_set_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "video_url" TEXT,
    "body_part" VARCHAR(100) NOT NULL,

    CONSTRAINT "exercise_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID NOT NULL,
    "trainee_id" UUID NOT NULL,
    "section_id" UUID,
    "workplace_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "duration" DECIMAL(3,1) NOT NULL,

    CONSTRAINT "training_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "training_comment_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_record" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainee_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "personal_record_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opinion" (
    "trainee_id" UUID NOT NULL,
    "trainer_id" UUID NOT NULL,
    "rate" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opinion_pk" PRIMARY KEY ("trainee_id","trainer_id")
);

-- CreateTable
CREATE TABLE "survey_answer" (
    "trainee_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "survey_answer_pk" PRIMARY KEY ("trainee_id","question_id")
);

-- CreateTable
CREATE TABLE "survey_question" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "survey_question_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "redirect_url" TEXT,
    "type" VARCHAR(30) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_slug_key" ON "trainer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "trainee_slug_key" ON "trainee"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- AddForeignKey
ALTER TABLE "trainer" ADD CONSTRAINT "trainer_user" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trainee" ADD CONSTRAINT "trainee_user" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coaching_request" ADD CONSTRAINT "coaching_request_client" FOREIGN KEY ("trainee_id") REFERENCES "trainee"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coaching_request" ADD CONSTRAINT "coaching_request_trainer" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coaching_request" ADD CONSTRAINT "coaching_request_workplace" FOREIGN KEY ("workplace_id") REFERENCES "workplace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cooperation" ADD CONSTRAINT "cooperation_trainee" FOREIGN KEY ("trainee_id") REFERENCES "trainee"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cooperation" ADD CONSTRAINT "cooperation_trainer" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cooperation" ADD CONSTRAINT "cooperation_workplace" FOREIGN KEY ("workplace_id") REFERENCES "workplace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workplace" ADD CONSTRAINT "workplace_trainer" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workout_plan" ADD CONSTRAINT "workout_plan_client" FOREIGN KEY ("trainee_id") REFERENCES "trainee"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workout_plan" ADD CONSTRAINT "workout_plan_trainer" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_workout_plan" FOREIGN KEY ("workout_plan_id") REFERENCES "workout_plan"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercise_set" ADD CONSTRAINT "set_exercise" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercise_set" ADD CONSTRAINT "set_section" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_trainer" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training" ADD CONSTRAINT "training_cooperation" FOREIGN KEY ("trainer_id", "trainee_id") REFERENCES "cooperation"("trainer_id", "trainee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training" ADD CONSTRAINT "training_section" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training" ADD CONSTRAINT "training_workplace" FOREIGN KEY ("workplace_id") REFERENCES "workplace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_comment" ADD CONSTRAINT "comment_training" FOREIGN KEY ("training_id") REFERENCES "training"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_comment" ADD CONSTRAINT "comment_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personal_record" ADD CONSTRAINT "record_exercise" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personal_record" ADD CONSTRAINT "record_trainee" FOREIGN KEY ("trainee_id") REFERENCES "trainee"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "opinion" ADD CONSTRAINT "opinion_trainee" FOREIGN KEY ("trainee_id") REFERENCES "trainee"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "opinion" ADD CONSTRAINT "opinion_trainer" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "survey_answer" ADD CONSTRAINT "answer_question" FOREIGN KEY ("question_id") REFERENCES "survey_question"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "survey_answer" ADD CONSTRAINT "answer_trainee" FOREIGN KEY ("trainee_id") REFERENCES "trainee"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;



--TRIGGERY

-- 1. TRIGGER DLA TRENERA 
CREATE OR REPLACE FUNCTION notify_on_new_trainer()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification (user_id, title, message, redirect_url, type, is_read)
    VALUES (
        NEW.id, 
        'Witaj w systemie UpMentor!',
        'Przejdź do swojego profilu i uzupełnij wizytówkę, aby przyszli podopieczni mogli poznać Twoją ofertę.',
        'dashboard/profile',
        'system',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_trainer
AFTER INSERT ON trainer
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_trainer();


-- 2. TRIGGER DLA PODOPTECZNEGO
CREATE OR REPLACE FUNCTION notify_on_new_trainee()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification (user_id, title, message, redirect_url, type, is_read)
    VALUES (
        NEW.id,
        'Witaj w systemie UpMentor!',
        'Przejdź do swojego profilu i uzupełnij ankietę startową niezbędną do współpracy z Twoim przyszłym trenerem.',
        'dashboard/profile',
        'system',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_trainee
AFTER INSERT ON trainee
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_trainee();