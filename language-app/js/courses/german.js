// German course. Words are [target, English, [accepted alternatives]].
(window.COURSES = window.COURSES || []).push({
  id: 'de',
  name: 'German',
  native: 'Deutsch',
  flag: '🇩🇪',
  voice: 'de-DE',
  units: [
    {
      title: 'First Words',
      description: 'Say hello, be polite and introduce yourself.',
      lessons: [
        {
          title: 'Greetings',
          tip: 'Every German noun starts with a capital letter: der Morgen, die Nacht.',
          words: [
            ['hallo', 'hello'],
            ['tschüss', 'goodbye', ['tschüs', 'auf Wiedersehen']],
            ['guten Morgen', 'good morning'],
            ['gute Nacht', 'good night'],
            ['danke', 'thank you'],
            ['bitte', 'please'],
          ],
          sentences: [
            ['Hallo, guten Morgen', 'Hello, good morning'],
            ['Danke, tschüss', 'Thank you, goodbye'],
          ],
        },
        {
          title: 'Polite Phrases',
          tip: '“Bitte” does a lot of work: please, you’re welcome, and “pardon?”.',
          words: [
            ['ja', 'yes'],
            ['nein', 'no'],
            ['gern geschehen', 'you’re welcome', ['bitte schön']],
            ['Entschuldigung', 'excuse me'],
            ['es tut mir leid', 'I’m sorry'],
            ["wie geht's?", 'how are you?', ['wie geht es dir?']],
          ],
          sentences: [
            ['Nein, danke', 'No, thank you'],
            ['Ja, bitte', 'Yes, please'],
          ],
        },
        {
          title: 'Introductions',
          tip: '“Du” is informal; use “Sie” (always capitalised) with strangers and in business.',
          words: [
            ['ich', 'I'],
            ['du', 'you'],
            ['ich heiße', 'my name is'],
            ['ich bin', 'I am'],
            ['freut mich', 'nice to meet you'],
            ['wie heißt du?', 'what is your name?'],
          ],
          sentences: [
            ['Hallo, ich heiße Anna', 'Hello, my name is Anna'],
            ['Freut mich, ich bin Max', 'Nice to meet you, I am Max'],
          ],
        },
      ],
    },
    {
      title: 'Food & Drink',
      description: 'Order food and drinks at a café.',
      lessons: [
        {
          title: 'Food',
          tip: 'German has three genders: der (masculine), die (feminine), das (neuter). Always learn the article.',
          words: [
            ['das Brot', 'the bread'],
            ['der Apfel', 'the apple'],
            ['der Käse', 'the cheese'],
            ['das Hähnchen', 'the chicken'],
            ['der Reis', 'the rice'],
            ['die Suppe', 'the soup'],
          ],
          sentences: [
            ['Ich möchte das Brot', 'I would like the bread'],
            ['Die Suppe und der Reis', 'The soup and the rice'],
          ],
        },
        {
          title: 'Drinks',
          tip: 'Can’t type ä, ö, ü or ß? Answers without them are accepted, and you’ll be shown the correct spelling.',
          words: [
            ['das Wasser', 'the water'],
            ['der Kaffee', 'the coffee'],
            ['der Tee', 'the tea'],
            ['die Milch', 'the milk'],
            ['der Wein', 'the wine'],
            ['der Saft', 'the juice'],
          ],
          sentences: [
            ['Ein Kaffee mit Milch', 'A coffee with milk'],
            ['Wasser, bitte', 'Water, please'],
          ],
        },
        {
          title: 'At the Café',
          tip: '“Ich möchte” (I would like) is the standard polite way to order.',
          words: [
            ['ich möchte', 'I would like'],
            ['die Rechnung', 'the bill'],
            ['der Tisch', 'the table'],
            ['was kostet das?', 'how much is that?'],
            ['lecker', 'delicious'],
            ['auch', 'also / too'],
          ],
          sentences: [
            ['Die Rechnung, bitte', 'The bill, please'],
            ['Ich möchte auch einen Tee', 'I would like a tea too'],
          ],
        },
      ],
    },
    {
      title: 'People & Numbers',
      description: 'Count to ten, talk about family and describe things.',
      lessons: [
        {
          title: 'Numbers 1–10',
          tip: 'When counting you say “eins”, but before a noun it becomes “ein/eine”: ein Apfel.',
          words: [
            ['eins', 'one'],
            ['zwei', 'two'],
            ['drei', 'three'],
            ['vier', 'four'],
            ['fünf', 'five'],
            ['sechs', 'six'],
            ['sieben', 'seven'],
            ['acht', 'eight'],
            ['neun', 'nine'],
            ['zehn', 'ten'],
          ],
          sentences: [
            ['Ich habe zwei Äpfel', 'I have two apples'],
            ['Fünf Kaffee, bitte', 'Five coffees, please'],
          ],
        },
        {
          title: 'Family',
          tip: '“My” follows the gender too: mein Vater, meine Mutter.',
          words: [
            ['die Mutter', 'the mother'],
            ['der Vater', 'the father'],
            ['der Bruder', 'the brother'],
            ['die Schwester', 'the sister'],
            ['der Sohn', 'the son'],
            ['die Tochter', 'the daughter'],
          ],
          sentences: [
            ['Meine Mutter heißt Anna', 'My mother is called Anna'],
            ['Ich habe einen Bruder', 'I have a brother'],
          ],
        },
        {
          title: 'Describing',
          tip: 'After “ist” or “bin”, adjectives never change: Das Haus ist groß. Ich bin müde.',
          words: [
            ['groß', 'big'],
            ['klein', 'small'],
            ['gut', 'good'],
            ['schlecht', 'bad'],
            ['glücklich', 'happy'],
            ['müde', 'tired'],
          ],
          sentences: [
            ['Ich bin müde', 'I am tired'],
            ['Das Haus ist groß', 'The house is big'],
          ],
        },
      ],
    },
  ],
});
