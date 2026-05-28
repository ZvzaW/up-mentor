
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



--HASLO DO WSZYSTKICH KONT - ABCabc11
--TRAINEE
INSERT INTO "user" (id, name, surname, email, phone, password, role) VALUES
('55555555-5555-5555-5555-555555555555', 'Anna', 'Kowalska', 'zw@op.pl', '123456789', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainee'),
('66666666-6666-6666-6666-666666666666', 'Michał', 'Wróbel', 'zw1@op.pl', '123456789', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainee');

INSERT INTO trainee (id, birthdate, slug) VALUES
('55555555-5555-5555-5555-555555555555', '2000-02-20', 'anna-kowalska'),
('66666666-6666-6666-6666-666666666666', '2000-01-12', 'michal-wrobel');


--TRAINER
INSERT INTO "user" (id, name, surname, email, phone, password, role) VALUES
('11111111-1111-1111-1111-111111111111', 'Piotr', 'Nowak', 'wz3@op.pl', '987654321', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainer'),
('22222222-2222-2222-2222-222222222222', 'Karolina', 'Wiśniewska', 'wz2@op.pl', '555444333', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainer'),
('33333333-3333-3333-3333-333333333333', 'Tomasz', 'Wójcik', 'wz1@op.pl', '111222333', '$argon2id$v=19$m=65536,t=3,p=4$2u37KIx7dz9gZuBZU8BPwQ$BUa5wRmJylz43DFJ7mko79H/+dk33D4NKOjGgyzTVSs', 'trainer'),
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


--COOPERATION
INSERT INTO cooperation (trainer_id, trainee_id, workplace_id, trainer_note, status) VALUES
('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, 'active');

--TRAININGS
INSERT INTO training (trainer_id, trainee_id,  scheduled_at, duration) VALUES
('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555',  '2026-05-28T11:30:00.000Z', 1.5),
('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555',  '2026-05-26T11:30:00.000Z', 1.5),
('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555',  '2026-05-24T11:30:00.000Z', 2),
('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555',  '2026-05-22T13:00:00.000Z', 1),
('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555',  '2026-04-26T11:30:00.000Z', 1),
('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555',  '2026-04-10T11:30:00.000Z', 1.5);
;



--EXERCISE
INSERT INTO exercise (name, body_part, video_url) VALUES
  -- Klatka piersiowa
  ('Pompki na TRX', 'Klatka piersiowa', NULL),
  ('Wyciskanie sztangi na ławce', 'Klatka piersiowa', NULL),

  -- Plecy
  ('Martwy ciąg', 'Plecy', NULL),
  ('Ściąganie drążka w siadzie', 'Plecy', NULL),

  -- Barki
  ('Wyciskanie sztangi zza głowy', 'Barki', 'https://www.youtube.com/watch?v=0uG8lIiAPpY'),
  ('Podciąganie sztangi wzdłuż tułowia', 'Barki', 'https://www.youtube.com/watch?v=UJN3gVIvNk4'),

  -- Biceps
  ('Uginanie ramion z hantlami nachwytem', 'Biceps', 'https://www.fabrykasily.pl/atlas-cwiczen/biceps/uginanie-ramion-z-hantlami-nachwytem'),
  ('Uginanie ramion na TRX', 'Biceps', 'https://www.fabrykasily.pl/atlas-cwiczen/biceps/uginanie-ramion-na-trx'),

  -- Triceps
  ('Wyciskanie francuskie sztangi łamanej leżąc', 'Triceps', 'https://www.fabrykasily.pl/atlas-cwiczen/triceps/wyciskanie-francuskie-w-lezeniu-na-podlodze'),
  ('Pompki na poręczach', 'Triceps', 'https://www.fabrykasily.pl/atlas-cwiczen/triceps/pompki-na-poreczach-samo-opuszczanie'),

  -- Przedramiona
  ('Uginanie nadgarstków podchwytem ze sztangą', 'Przedramiona', NULL),
  ('Uginanie nadgarstków nachwytem ze sztangą', 'Przedramiona', NULL),

  -- Brzuch / Core
  ('Plank (Deska)', 'Brzuch / Core', NULL),
  ('Nożyce nogami', 'Brzuch / Core', 'https://www.fabrykasily.pl/atlas-cwiczen/brzuch/nozyce-nogami'),

  -- Pośladki / Tylna część ud
  ('Hip thrust', 'Pośladki / Tylna część ud', NULL),
  ('Przywodzenie nóg na maszynie', 'Pośladki / Tylna część ud', 'https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/przywodzenie-nog-na-maszynie'),

  -- Uda (przód)
  ('Przysiad bułgarski', 'Uda (przód)', 'https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-bulgarski-wersja-posladkowa-z-hantlami'),
  ('Wyciskanie nóg na suwnicy', 'Uda (przód)', NULL),

  -- Łydki
  ('Wspięcia na palcach na suwnicy', 'Łydki', 'https://www.fabrykasily.pl/cwiczenia/na-lydki/wspiecia-na-palcach-na-suwnicy-calf'),
  ('Wspięcia na palce ze sztangą na plecach', 'Łydki', NULL),

  -- Full body
  ('Padnij-powstań (Burpees)', 'Full body', NULL),
  ('Zarzut sztangi na klatkę (Power clean)', 'Full body', NULL);



