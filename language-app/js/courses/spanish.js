// Spanish course. Words are [target, English, [accepted alternatives]].
(window.COURSES = window.COURSES || []).push({
  id: 'es',
  name: 'Spanish',
  native: 'Español',
  flag: '🇪🇸',
  voice: 'es-ES',
  units: [
    {
      title: 'First Words',
      description: 'Say hello, be polite and introduce yourself.',
      lessons: [
        {
          title: 'Greetings',
          tip: 'Spanish questions and exclamations start with an upside-down mark: ¡Hola! ¿Qué tal?',
          words: [
            ['hola', 'hello'],
            ['adiós', 'goodbye'],
            ['buenos días', 'good morning'],
            ['buenas noches', 'good night'],
            ['gracias', 'thank you'],
            ['por favor', 'please'],
          ],
          sentences: [
            ['Hola, buenos días', 'Hello, good morning'],
            ['Gracias, adiós', 'Thank you, goodbye'],
          ],
        },
        {
          title: 'Polite Phrases',
          tip: '“Perdón” gets someone’s attention or apologises for bumping into them; “lo siento” is a heartfelt sorry.',
          words: [
            ['sí', 'yes'],
            ['no', 'no'],
            ['de nada', 'you’re welcome'],
            ['lo siento', 'I’m sorry'],
            ['perdón', 'excuse me'],
            ['¿qué tal?', 'how are you?'],
          ],
          sentences: [
            ['No, gracias', 'No, thank you'],
            ['Sí, por favor', 'Yes, please'],
          ],
        },
        {
          title: 'Introductions',
          tip: '“Tú” is the informal “you”. Use “usted” with strangers and elders.',
          words: [
            ['yo', 'I'],
            ['tú', 'you'],
            ['me llamo', 'my name is'],
            ['soy', 'I am'],
            ['mucho gusto', 'nice to meet you'],
            ['¿cómo te llamas?', 'what is your name?'],
          ],
          sentences: [
            ['Hola, me llamo Ana', 'Hello, my name is Ana'],
            ['Mucho gusto, soy Carlos', 'Nice to meet you, I am Carlos'],
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
          tip: 'Every noun is masculine (el) or feminine (la). Learn the article together with the word.',
          words: [
            ['el pan', 'the bread'],
            ['la manzana', 'the apple'],
            ['el queso', 'the cheese'],
            ['el pollo', 'the chicken'],
            ['el arroz', 'the rice'],
            ['la sopa', 'the soup'],
          ],
          sentences: [
            ['Quiero el pan', 'I want the bread'],
            ['La sopa y el arroz', 'The soup and the rice'],
          ],
        },
        {
          title: 'Drinks',
          tip: '“Agua” is feminine but takes “el” because it starts with a stressed a-sound: el agua fría.',
          words: [
            ['el agua', 'the water'],
            ['el café', 'the coffee'],
            ['el té', 'the tea'],
            ['la leche', 'the milk'],
            ['el vino', 'the wine'],
            ['el zumo', 'the juice', ['el jugo']],
          ],
          sentences: [
            ['Un café con leche', 'A coffee with milk'],
            ['Agua, por favor', 'Water, please'],
          ],
        },
        {
          title: 'At the Café',
          tip: '“Quiero” (I want) is fine when ordering; “quisiera” (I would like) is a little more polite.',
          words: [
            ['quiero', 'I want'],
            ['la cuenta', 'the bill'],
            ['la mesa', 'the table'],
            ['¿cuánto cuesta?', 'how much does it cost?'],
            ['delicioso', 'delicious'],
            ['también', 'also / too'],
          ],
          sentences: [
            ['La cuenta, por favor', 'The bill, please'],
            ['Quiero un té también', 'I want a tea too'],
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
          tip: '“Uno” becomes “un” before a masculine noun and “una” before a feminine one: un café, una manzana.',
          words: [
            ['uno', 'one'],
            ['dos', 'two'],
            ['tres', 'three'],
            ['cuatro', 'four'],
            ['cinco', 'five'],
            ['seis', 'six'],
            ['siete', 'seven'],
            ['ocho', 'eight'],
            ['nueve', 'nine'],
            ['diez', 'ten'],
          ],
          sentences: [
            ['Tengo dos manzanas', 'I have two apples'],
            ['Cinco cafés, por favor', 'Five coffees, please'],
          ],
        },
        {
          title: 'Family',
          tip: 'The masculine plural covers mixed groups: “los padres” means “the parents”.',
          words: [
            ['la madre', 'the mother'],
            ['el padre', 'the father'],
            ['el hermano', 'the brother'],
            ['la hermana', 'the sister'],
            ['el hijo', 'the son'],
            ['la hija', 'the daughter'],
          ],
          sentences: [
            ['Mi madre se llama Ana', 'My mother is called Ana'],
            ['Tengo un hermano', 'I have a brother'],
          ],
        },
        {
          title: 'Describing',
          tip: 'Adjectives usually follow the noun and match its gender: el gato pequeño, la casa pequeña.',
          words: [
            ['grande', 'big'],
            ['pequeño', 'small'],
            ['bueno', 'good'],
            ['malo', 'bad'],
            ['feliz', 'happy'],
            ['cansado', 'tired', ['cansada']],
          ],
          sentences: [
            ['Estoy cansado', 'I am tired'],
            ['La casa es grande', 'The house is big'],
          ],
        },
      ],
    },
  ],
});
