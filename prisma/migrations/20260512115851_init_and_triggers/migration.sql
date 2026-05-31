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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(10) NOT NULL DEFAULT 'pending',

    CONSTRAINT "coaching_request_pk" PRIMARY KEY ("trainer_id","trainee_id")
);

-- CreateTable
CREATE TABLE "cooperation" (
    "trainer_id" UUID NOT NULL,
    "trainee_id" UUID NOT NULL,
    "workplace_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

    CONSTRAINT "workout_plan_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans_library" (
    trainee_id uuid NOT NULL,
    workout_plan_id uuid NOT NULL,
    CONSTRAINT plans_library_pk PRIMARY KEY (trainee_id, workout_plan_id)
);

-- CreateTable
CREATE TABLE "section" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_plan_id" UUID NOT NULL,
    "body_part" VARCHAR(100),
    "order" INTEGER NOT NULL,

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
    "order" INTEGER NOT NULL,

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
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "duration" DECIMAL(3,1) NOT NULL,

    CONSTRAINT "training_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opinion" (
    "trainee_id" UUID NOT NULL,
    "trainer_id" UUID NOT NULL,
    "rate" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "refresh_token_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID NOT NULL,
    "trainee_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "password_reset_token_pk" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_slug_key" ON "trainer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "trainee_slug_key" ON "trainee"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_key" ON "refresh_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_key" ON "password_reset_token"("token");

-- CreateIndex
CREATE INDEX "message_cooperation_date_key" ON "chat_message"("trainer_id", "trainee_id", "created_at");


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
ALTER TABLE "cooperation" ADD CONSTRAINT "cooperation_workplace" FOREIGN KEY ("workplace_id") REFERENCES "workplace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workplace" ADD CONSTRAINT "workplace_trainer" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workout_plan" ADD CONSTRAINT "workout_plan_trainer" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plans_library" ADD CONSTRAINT "plans_library_trainee" FOREIGN KEY ("trainee_id") REFERENCES "trainee"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plans_library" ADD CONSTRAINT "plans_library_workout" FOREIGN KEY ("workout_plan_id") REFERENCES "workout_plan"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

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

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_cooperation" FOREIGN KEY ("trainer_id", "trainee_id") REFERENCES "cooperation"("trainer_id", "trainee_id") ON DELETE CASCADE ON UPDATE NO ACTION;




--TRIGGERY - POWIADOMIENIA
-- 1. NOWY TRENER
CREATE OR REPLACE FUNCTION notify_on_new_trainer()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification (user_id, title, message, redirect_url, type)
    VALUES (
        NEW.id, 
        'Witaj w systemie Up-Mentor!',
        'Przejdź do swojego profilu i uzupełnij wizytówkę, aby przyszli podopieczni mogli poznać Twoją ofertę.',
        'dashboard/profile',
        'system'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_trainer
AFTER INSERT ON trainer
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_trainer();


-- 2. NOWY PODOPIECZNY
CREATE OR REPLACE FUNCTION notify_on_new_trainee()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification (user_id, title, message, redirect_url, type)
    VALUES (
        NEW.id,
        'Witaj w systemie Up-Mentor!',
        'Przejdź do swojego profilu i uzupełnij ankietę startową niezbędną do współpracy z Twoim przyszłym trenerem.',
        'dashboard/profile',
        'system'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_trainee
AFTER INSERT ON trainee
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_trainee();


-- 3. NOWA PROSBA O WSPOLPRACE
CREATE OR REPLACE FUNCTION notify_trainer_on_coaching_request()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification (user_id, title, message, redirect_url, type)
    VALUES (
        NEW.trainer_id, 
        'Nowa prośba o współpracę!',
        'Otrzymałeś nową prośbę o nawiązanie współpracy. Sprawdź szczegóły.',
        '/dashboard/trainees', 
        'request'

    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_trainer_request ON coaching_request;

CREATE TRIGGER trigger_notify_trainer_request
AFTER INSERT ON coaching_request
FOR EACH ROW
EXECUTE FUNCTION notify_trainer_on_coaching_request();



-- 4. PROSBA ZAAKCEPTOWANA
CREATE OR REPLACE FUNCTION notify_trainee_on_cooperation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification (user_id, title, message, redirect_url, type)
    VALUES (
        NEW.trainee_id,
        'Współpraca rozpoczęta!',
        'Twój trener zaakceptował prośbę o współpracę.',
        '/dashboard/trainers', 
        'system'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_trainee_cooperation ON cooperation;

CREATE TRIGGER trigger_notify_trainee_cooperation
AFTER INSERT ON cooperation
FOR EACH ROW
EXECUTE FUNCTION notify_trainee_on_cooperation();




-- 5. NOWA WIADOMOSC NA CZACIE
CREATE OR REPLACE FUNCTION notify_on_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
    v_receiver_id UUID;
    v_existing_notif_id UUID;
    v_sender_name VARCHAR(100);
    v_sender_surname VARCHAR(100);
    v_redirect_url TEXT;
    v_message VARCHAR(255);
BEGIN

    SELECT name, surname INTO v_sender_name, v_sender_surname
    FROM "user"
    WHERE id = NEW.sender_id;

    IF NEW.sender_id = NEW.trainer_id THEN
        v_receiver_id := NEW.trainee_id;
        v_redirect_url := '/dashboard/chat?trainer=' || NEW.sender_id::text;
    ELSE
        v_receiver_id := NEW.trainer_id;
        v_redirect_url := '/dashboard/chat?trainee=' || NEW.sender_id::text;
    END IF;

    v_message := v_sender_name || ' ' || v_sender_surname || ' wysłał(a) Ci wiadomość.';

    SELECT id INTO v_existing_notif_id
    FROM notification
    WHERE user_id = v_receiver_id
      AND type = 'message'
      AND is_read = false
      AND redirect_url = v_redirect_url
    LIMIT 1;

    IF v_existing_notif_id IS NOT NULL THEN
        UPDATE notification
        SET created_at = NOW()
        WHERE id = v_existing_notif_id;
    ELSE
        INSERT INTO notification (user_id, title, message, redirect_url, type, is_read, created_at)
        VALUES (
            v_receiver_id,
            'Nowa wiadomość',
            v_message,
            v_redirect_url,
            'message',
            false,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_new_chat_message ON chat_message;

CREATE TRIGGER trigger_notify_on_new_chat_message
AFTER INSERT ON chat_message
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_chat_message();


-- 6. NOWY TRENING
CREATE OR REPLACE FUNCTION notify_on_new_training()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification (user_id, title, message, redirect_url, type)
    VALUES (
        NEW.trainee_id, 
        'Nowy trening',
        'Twój trener zaplanował dla Ciebie nowy trening. Sprawdź swój kalendarz.',
        '/dashboard/trainings',
        'training'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_training ON training;

CREATE TRIGGER trigger_notify_new_training
AFTER INSERT ON training
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_training();


-- 7. UDOSTEPNIONY NOWY PLAN TRENINGOWY 
CREATE OR REPLACE FUNCTION notify_on_plan_shared()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_name VARCHAR(255);
BEGIN

    SELECT name INTO v_plan_name
    FROM workout_plan
    WHERE id = NEW.workout_plan_id;

    INSERT INTO notification (user_id, title, message, redirect_url, type)
    VALUES (
        NEW.trainee_id,
        'Nowy plan treningowy',
        'Twój trener udostępnił Ci nowy plan treningowy: ' || v_plan_name || '. Sprawdź go!',
        '/dashboard/workout-plans',
        'workout_plan'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_plan_shared ON plans_library;

CREATE TRIGGER trigger_notify_plan_shared
AFTER INSERT ON plans_library
FOR EACH ROW
EXECUTE FUNCTION notify_on_plan_shared();