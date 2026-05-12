CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "user" (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,
    surname varchar(100) NOT NULL,
    email varchar(100) NOT NULL UNIQUE,
    phone varchar(30) NOT NULL,
    password text NOT NULL,
    role varchar(20) NOT NULL,
    CONSTRAINT user_pk PRIMARY KEY (id)
);

CREATE TABLE trainer (
    id uuid NOT NULL, -- PK z user
    work_description text NULL,
    price_per_training int NULL, 
    is_public boolean NOT NULL DEFAULT true,
    slug text NOT NULL,
    CONSTRAINT trainer_pk PRIMARY KEY (id)
);

CREATE TABLE trainee (
    id uuid NOT NULL, -- PK z user
    birthdate date NOT NULL,
    slug text NOT NULL,
    CONSTRAINT trainee_pk PRIMARY KEY (id)
);

CREATE TABLE coaching_request (
    trainer_id uuid NOT NULL,
    trainee_id uuid NOT NULL,
    workplace_id uuid NOT NULL, 
    message text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    status varchar(10) NOT NULL DEFAULT 'pending', 
    CONSTRAINT coaching_request_pk PRIMARY KEY (trainer_id, trainee_id),
    CONSTRAINT coaching_request_status_check CHECK (status IN ('pending', 'accepted', 'refused'))
);

CREATE TABLE cooperation (
    trainer_id uuid NOT NULL,
    trainee_id uuid NOT NULL,
    workplace_id uuid NOT NULL, 
    created_at timestamptz NOT NULL DEFAULT now(),
    trainer_note text NULL,
    status varchar(10) NOT NULL DEFAULT 'active', 
    CONSTRAINT cooperation_pk PRIMARY KEY (trainer_id, trainee_id),
    CONSTRAINT cooperation_status_check CHECK (status IN ('active', 'ended'))
);

CREATE TABLE workplace (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    trainer_id uuid NOT NULL,
    name varchar(120) NOT NULL,
    street varchar(120) NOT NULL,
    building_number varchar(20) NOT NULL,
    flat_number varchar(20) NULL,
    city varchar(120) NOT NULL,
    CONSTRAINT workplace_pk PRIMARY KEY (id)
);

CREATE TABLE workout_plan (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    trainer_id uuid NOT NULL,
    name varchar(255) NOT NULL,
    difficulty varchar(100) NULL,
    description text NULL,
    trainee_id uuid NULL,
    CONSTRAINT workout_plan_pk PRIMARY KEY (id)
);

CREATE TABLE section (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    workout_plan_id uuid NOT NULL,
    name varchar(255) NULL,
    body_part varchar(100) NULL,
    order_index int NOT NULL,
    CONSTRAINT section_pk PRIMARY KEY (id)
);

CREATE TABLE exercise_set (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    exercise_id uuid NOT NULL,
    section_id uuid NOT NULL,
    series_count int NOT NULL,
    reps_count int NOT NULL,
    weight decimal(5,2) NULL,
    order_index int NOT NULL,
    CONSTRAINT exercise_set_pk PRIMARY KEY (id)
);

CREATE TABLE exercise (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    trainer_id uuid NULL,
    name varchar(255) NOT NULL,
    video_url text NULL,
    body_part varchar(100) NOT NULL,
    CONSTRAINT exercise_pk PRIMARY KEY (id)
);

CREATE TABLE training (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    trainer_id uuid NOT NULL,
    trainee_id uuid NOT NULL,
    section_id uuid NULL,
    workplace_id uuid NOT NULL,
    date date NOT NULL,
    start_time time NOT NULL,
    duration decimal(3,1) NOT NULL,
    CONSTRAINT training_pk PRIMARY KEY (id)
);

CREATE TABLE training_comment (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    training_id uuid NOT NULL,
    content text NOT NULL,
    CONSTRAINT training_comment_pk PRIMARY KEY (id)
);

CREATE TABLE personal_record (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    trainee_id uuid NOT NULL,
    exercise_id uuid NOT NULL,
    weight decimal(5,2) NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT personal_record_pk PRIMARY KEY (id)
);

CREATE TABLE survey_question (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    question text NOT NULL,
    order int NOT NULL,
    CONSTRAINT survey_question_pk PRIMARY KEY (id)
);

CREATE TABLE survey_answer (
    trainee_id uuid NOT NULL,
    question_id uuid NOT NULL,
    answer text NOT NULL,
    CONSTRAINT survey_answer_pk PRIMARY KEY (trainee_id, question_id)
);

CREATE TABLE opinion (
    trainee_id uuid NOT NULL,
    trainer_id uuid NOT NULL,
    rate int NOT NULL,
    comment text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT opinion_pk PRIMARY KEY (trainee_id, trainer_id)
);

CREATE TABLE notification (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title varchar(255) NOT NULL,
    message varchar(255) NOT NULL,
    redirect_url text NULL,
    type varchar(30) NOT NULL,
    is_read boolean NOT NULL DEFAULT false, 
    created_at timestamp  NOT NULL DEFAULT now(),
    CONSTRAINT notification_pk PRIMARY KEY (id)
);

CREATE TABLE refresh_token (
    id uuid  NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid  NOT NULL,
    token text  NOT NULL UNIQUE,
    expires_at timestamp  NOT NULL,
    CONSTRAINT refresh_token_pk PRIMARY KEY (id)
);


-- Foreign Keys
ALTER TABLE trainer ADD CONSTRAINT trainer_user FOREIGN KEY (id) REFERENCES "user" (id) ON DELETE CASCADE;
ALTER TABLE trainee ADD CONSTRAINT trainee_user FOREIGN KEY (id) REFERENCES "user" (id) ON DELETE CASCADE;
ALTER TABLE refresh_token ADD CONSTRAINT refresh_token_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;
ALTER TABLE workplace ADD CONSTRAINT workplace_trainer FOREIGN KEY (trainer_id) REFERENCES trainer (id) ON DELETE CASCADE;
ALTER TABLE coaching_request ADD CONSTRAINT coaching_request_client FOREIGN KEY (trainee_id) REFERENCES trainee (id);
ALTER TABLE coaching_request ADD CONSTRAINT coaching_request_trainer FOREIGN KEY (trainer_id) REFERENCES trainer (id);
ALTER TABLE coaching_request ADD CONSTRAINT coaching_request_workplace FOREIGN KEY (workplace_id) REFERENCES workplace (id);
ALTER TABLE cooperation ADD CONSTRAINT cooperation_workplace FOREIGN KEY (workplace_id) REFERENCES workplace (id);
ALTER TABLE cooperation ADD CONSTRAINT cooperation_trainee FOREIGN KEY (trainee_id) REFERENCES trainee (id);
ALTER TABLE cooperation ADD CONSTRAINT cooperation_trainer FOREIGN KEY (trainer_id) REFERENCES trainer (id);
ALTER TABLE exercise ADD CONSTRAINT exercise_trainer FOREIGN KEY (trainer_id) REFERENCES trainer (id);
ALTER TABLE workout_plan ADD CONSTRAINT workout_plan_client FOREIGN KEY (trainee_id) REFERENCES trainee (id);
ALTER TABLE workout_plan ADD CONSTRAINT workout_plan_trainer FOREIGN KEY (trainer_id) REFERENCES trainer (id);
ALTER TABLE section ADD CONSTRAINT section_workout_plan FOREIGN KEY (workout_plan_id) REFERENCES workout_plan (id) ON DELETE CASCADE;
ALTER TABLE exercise_set ADD CONSTRAINT set_exercise FOREIGN KEY (exercise_id) REFERENCES exercise (id);
ALTER TABLE exercise_set ADD CONSTRAINT set_section FOREIGN KEY (section_id) REFERENCES section (id) ON DELETE CASCADE;
ALTER TABLE training ADD CONSTRAINT training_cooperation FOREIGN KEY (trainer_id, trainee_id) REFERENCES cooperation (trainer_id, trainee_id);
ALTER TABLE training ADD CONSTRAINT training_section FOREIGN KEY (section_id) REFERENCES section (id);
ALTER TABLE training ADD CONSTRAINT training_workplace FOREIGN KEY (workplace_id) REFERENCES workplace (id);
ALTER TABLE personal_record ADD CONSTRAINT record_trainee FOREIGN KEY (trainee_id) REFERENCES trainee (id);
ALTER TABLE personal_record ADD CONSTRAINT record_exercise FOREIGN KEY (exercise_id) REFERENCES exercise (id);
ALTER TABLE opinion ADD CONSTRAINT opinion_trainee FOREIGN KEY (trainee_id) REFERENCES trainee (id);
ALTER TABLE opinion ADD CONSTRAINT opinion_trainer FOREIGN KEY (trainer_id) REFERENCES trainer (id);
ALTER TABLE notification ADD CONSTRAINT notification_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;
ALTER TABLE survey_answer ADD CONSTRAINT answer_trainee FOREIGN KEY (trainee_id) REFERENCES trainee (id);
ALTER TABLE survey_answer ADD CONSTRAINT answer_question FOREIGN KEY (question_id) REFERENCES survey_question (id);
ALTER TABLE training_comment ADD CONSTRAINT comment_training FOREIGN KEY (training_id) REFERENCES training (id) ON DELETE CASCADE;
ALTER TABLE training_comment ADD CONSTRAINT comment_user FOREIGN KEY (user_id) REFERENCES "user" (id);



--DATA
INSERT INTO survey_question (question, "order") VALUES
('Jaki jest Twój główny cel treningowy (np. redukcja wagi, budowa masy mięśniowej, poprawa kondycji)?', 1),
('Ile godzin tygodniowo możesz przeznaczyć na treningi?', 2),
('Jak wyglądał Twój dotychczasowy staż treningowy i aktywność fizyczna?', 3),

('Czy w przeszłości doznałeś/aś jakichś poważnych kontuzji (np. złamania, zwichnięcia)? Jeśli tak, to jakich i kiedy?', 4),
('Czy obecnie odczuwasz ból w jakiejkolwiek części ciała podczas ruchu lub w spoczynku? Gdzie dokładnie?', 5),
('Czy cierpisz na choroby przewlekłe (np. nadciśnienie, cukrzyca, wady postawy)?', 6),
('Czy przyjmujesz na stałe jakieś leki? Jeśli tak, to jakie?', 7),
('Czy w ciągu ostatnich 6 miesięcy miałeś/aś wykonywane jakieś zabiegi chirurgiczne?', 8);


--TRAINEE
INSERT INTO "user" (id, name, surname, email, phone, password, role) VALUES
('049392cf-fdc8-4c95-b89b-2cf48ce2485e', 'Anna', 'Kowalska', 'zw@op.pl', '123456789', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainee'),
('7a691694-f4c9-4677-8a90-d80a184e5773', 'Michał', 'Wróbel', 'zw1@op.pl', '123456789', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainee');

INSERT INTO trainee (id, birthdate, slug) VALUES
('049392cf-fdc8-4c95-b89b-2cf48ce2485e', '2000-02-20', 'anna-kowalska'),
('7a691694-f4c9-4677-8a90-d80a184e5773', '2000-01-12', 'michal-wrobel');


--TRAINER
INSERT INTO "user" (id, name, surname, email, phone, password, role) VALUES
('11111111-1111-1111-1111-111111111111', 'Piotr', 'Nowak', 'wz4@op.pl', '987654321', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainer'),
('22222222-2222-2222-2222-222222222222', 'Karolina', 'Wiśniewska', 'wz3@op.pl', '555444333', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainer'),
('33333333-3333-3333-3333-333333333333', 'Tomasz', 'Wójcik', 'wz2@op.pl', '111222333', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainer'),
('44444444-4444-4444-4444-444444444444', 'Jan', 'Kowalski', 'wz@op.pl', '123456789', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainer');

INSERT INTO trainer (id, work_description, price_per_training, is_public, slug) VALUES
('11111111-1111-1111-1111-111111111111', 'Ekspert od przygotowania motorycznego. Praca ze sportowcami i amatorami pragnącymi poprawić swoje wyniki siłowe.', 180, true, 'piotr-nowak'),
('22222222-2222-2222-2222-222222222222', 'Trener medyczny i instruktor Pilates. Skupiam się na zdrowiu kręgosłupa, poprawie postawy i bezpiecznym powrocie do formy po urazach.', 160, true, 'karolina-wisniewska'),
('33333333-3333-3333-3333-333333333333', 'Specjalista ds. hipertrofii i rekompozycji sylwetki. Ze mną zbudujesz masę mięśniową i skutecznie zredukujesz tkankę tłuszczową.', 140, true, 'tomasz-wojcik'),
('44444444-4444-4444-4444-444444444444', 'Trener personalny z wieloletnim stażem. Specjalista od kształtowania sylwetki, treningu funkcjonalnego oraz powrotu do sprawności po urazach. Pomagam w bezpieczny i skuteczny sposób osiągać cele, poprawiać mobilność i budować zdrowe nawyki żywieniowe na lata. Trenuj z głową, a nie tylko siłą!', 150, true, 'jan-kowalski');

INSERT INTO workplace (id, trainer_id, name, street, building_number, flat_number, city) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'CityFit', 'Młynarska', '1', NULL, 'Warszawa'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Zdrofit Wilanów', 'Klimczaka', '1', '2A', 'Warszawa'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Fabryka Formy', 'Bałtycka', '5', NULL, 'Poznań'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'Zdrofit', 'Wałowa', '10', NULL, 'Warszawa');




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