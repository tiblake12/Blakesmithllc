// French course. Words are [target, English, [accepted alternatives]].
(window.COURSES = window.COURSES || []).push({
  id: 'fr',
  name: 'French',
  native: 'Français',
  flag: '🇫🇷',
  voice: 'fr-FR',
  units: [
    {
      title: 'First Words',
      description: 'Say hello, be polite and introduce yourself.',
      lessons: [
        {
          title: 'Greetings',
          tip: '“S’il vous plaît” is the polite form; with friends say “s’il te plaît”.',
          words: [
            ['bonjour', 'hello'],
            ['au revoir', 'goodbye'],
            ['bonsoir', 'good evening'],
            ['bonne nuit', 'good night'],
            ['merci', 'thank you'],
            ["s'il vous plaît", 'please', ["s'il te plaît"]],
          ],
          sentences: [
            ['Bonjour, merci beaucoup', 'Hello, thank you very much'],
            ['Merci, au revoir', 'Thank you, goodbye'],
          ],
        },
        {
          title: 'Polite Phrases',
          tip: 'Many French words change spelling for a woman speaker: désolé (m) / désolée (f).',
          words: [
            ['oui', 'yes'],
            ['non', 'no'],
            ['de rien', 'you’re welcome'],
            ['pardon', 'excuse me'],
            ['désolé', 'sorry', ['désolée']],
            ['ça va?', 'how are you?'],
          ],
          sentences: [
            ['Non, merci', 'No, thank you'],
            ['Oui, ça va', 'Yes, I am fine'],
          ],
        },
        {
          title: 'Introductions',
          tip: '“Tu” is informal; use “vous” with strangers, elders, or more than one person.',
          words: [
            ['je', 'I'],
            ['tu', 'you'],
            ["je m'appelle", 'my name is'],
            ['je suis', 'I am'],
            ['enchanté', 'nice to meet you', ['enchantée']],
            ["comment tu t'appelles?", 'what is your name?'],
          ],
          sentences: [
            ["Bonjour, je m'appelle Marie", 'Hello, my name is Marie'],
            ['Enchanté, je suis Paul', 'Nice to meet you, I am Paul'],
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
          tip: 'Nouns are masculine (le) or feminine (la). Both become l’ before a vowel: l’eau.',
          words: [
            ['le pain', 'the bread'],
            ['la pomme', 'the apple'],
            ['le fromage', 'the cheese'],
            ['le poulet', 'the chicken'],
            ['le riz', 'the rice'],
            ['la soupe', 'the soup'],
          ],
          sentences: [
            ['Je voudrais le pain', 'I would like the bread'],
            ['La soupe et le riz', 'The soup and the rice'],
          ],
        },
        {
          title: 'Drinks',
          tip: 'To ask for “some” of something, use du / de la / de l’: du pain, de l’eau.',
          words: [
            ["l'eau", 'the water'],
            ['le café', 'the coffee'],
            ['le thé', 'the tea'],
            ['le lait', 'the milk'],
            ['le vin', 'the wine'],
            ['le jus', 'the juice'],
          ],
          sentences: [
            ['Un café au lait', 'A coffee with milk'],
            ["De l'eau, s'il vous plaît", 'Some water, please'],
          ],
        },
        {
          title: 'At the Café',
          tip: '“Je voudrais” (I would like) is the polite way to order. “Je veux” (I want) sounds blunt.',
          words: [
            ['je voudrais', 'I would like'],
            ["l'addition", 'the bill'],
            ['la table', 'the table'],
            ['combien ça coûte?', 'how much does it cost?'],
            ['délicieux', 'delicious'],
            ['aussi', 'also / too'],
          ],
          sentences: [
            ["L'addition, s'il vous plaît", 'The bill, please'],
            ['Je voudrais un thé aussi', 'I would like a tea too'],
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
          tip: 'The final consonant of six, huit and dix is silent before a consonant: six cafés sounds like “see”.',
          words: [
            ['un', 'one'],
            ['deux', 'two'],
            ['trois', 'three'],
            ['quatre', 'four'],
            ['cinq', 'five'],
            ['six', 'six'],
            ['sept', 'seven'],
            ['huit', 'eight'],
            ['neuf', 'nine'],
            ['dix', 'ten'],
          ],
          sentences: [
            ["J'ai deux pommes", 'I have two apples'],
            ["Cinq cafés, s'il vous plaît", 'Five coffees, please'],
          ],
        },
        {
          title: 'Family',
          tip: '“My” changes with the noun’s gender: mon père, ma mère, mes parents.',
          words: [
            ['la mère', 'the mother'],
            ['le père', 'the father'],
            ['le frère', 'the brother'],
            ['la sœur', 'the sister', ['la soeur']],
            ['le fils', 'the son'],
            ['la fille', 'the daughter'],
          ],
          sentences: [
            ["Ma mère s'appelle Marie", 'My mother is called Marie'],
            ["J'ai un frère", 'I have a brother'],
          ],
        },
        {
          title: 'Describing',
          tip: 'Most adjectives follow the noun, but short common ones like grand, petit and bon go before it.',
          words: [
            ['grand', 'big', ['grande']],
            ['petit', 'small', ['petite']],
            ['bon', 'good', ['bonne']],
            ['mauvais', 'bad', ['mauvaise']],
            ['heureux', 'happy', ['heureuse']],
            ['fatigué', 'tired', ['fatiguée']],
          ],
          sentences: [
            ['Je suis fatigué', 'I am tired'],
            ['La maison est grande', 'The house is big'],
          ],
        },
      ],
    },
  ],
});
