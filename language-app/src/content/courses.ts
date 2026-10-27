// Course content, written to be spoken aloud.
// Words are [target, English, accepted target-language alternatives].
// Sentences are [target, English].
import type { RawCourse } from "./types";

export const spanish: RawCourse = {
  id: "es",
  name: "Spanish",
  native: "Español",
  flag: "🇪🇸",
  voice: "es-ES",
  units: [
    {
      title: "First Words",
      description: "Say hello, be polite and introduce yourself.",
      lessons: [
        {
          title: "Greetings",
          tip: "Say {buenos días} in the morning and {buenas noches} at night. {Hola} works any time of day.",
          words: [
            ["hola","hello"],
            ["adiós","goodbye"],
            ["buenos días","good morning"],
            ["buenas noches","good night"],
            ["gracias","thank you"],
            ["por favor","please"],
          ],
          sentences: [
            ["Hola, buenos días","Hello, good morning"],
            ["Gracias, adiós","Thank you, goodbye"],
          ],
        },
        {
          title: "Polite Phrases",
          tip: "Use {perdón} to get someone's attention, and {lo siento} when you are truly sorry.",
          words: [
            ["sí","yes"],
            ["no","no"],
            ["de nada","you’re welcome"],
            ["lo siento","I’m sorry"],
            ["perdón","excuse me"],
            ["¿qué tal?","how are you?"],
          ],
          sentences: [
            ["No, gracias","No, thank you"],
            ["Sí, por favor","Yes, please"],
          ],
        },
        {
          title: "Introductions",
          tip: "{Tú} is the friendly way to say you. With strangers and older people, use {usted}.",
          words: [
            ["yo","I"],
            ["tú","you"],
            ["me llamo","my name is"],
            ["soy","I am"],
            ["mucho gusto","nice to meet you"],
            ["¿cómo te llamas?","what is your name?"],
          ],
          sentences: [
            ["Hola, me llamo Ana","Hello, my name is Ana"],
            ["Mucho gusto, soy Carlos","Nice to meet you, I am Carlos"],
          ],
        },
      ],
    },
    {
      title: "Food & Drink",
      description: "Order food and drinks at a café.",
      lessons: [
        {
          title: "Food",
          tip: "Every Spanish noun is masculine or feminine. Masculine words use {el}, feminine words use {la}. Learn the little word together with the noun.",
          words: [
            ["el pan","the bread"],
            ["la manzana","the apple"],
            ["el queso","the cheese"],
            ["el pollo","the chicken"],
            ["el arroz","the rice"],
            ["la sopa","the soup"],
          ],
          sentences: [
            ["Quiero el pan","I want the bread"],
            ["La sopa y el arroz","The soup and the rice"],
          ],
        },
        {
          title: "Drinks",
          tip: "{Agua} is feminine, but it takes {el} because it starts with a stressed a sound: {el agua}.",
          words: [
            ["el agua","the water"],
            ["el café","the coffee"],
            ["el té","the tea"],
            ["la leche","the milk"],
            ["el vino","the wine"],
            ["el zumo","the juice",["el jugo"]],
          ],
          sentences: [
            ["Un café con leche","A coffee with milk"],
            ["Agua, por favor","Water, please"],
          ],
        },
        {
          title: "At the Café",
          tip: "{Quiero} means I want, and it's fine for ordering. {Quisiera}, I would like, is a little more polite.",
          words: [
            ["quiero","I want"],
            ["la cuenta","the bill"],
            ["la mesa","the table"],
            ["¿cuánto cuesta?","how much does it cost?"],
            ["delicioso","delicious"],
            ["también","also / too"],
          ],
          sentences: [
            ["La cuenta, por favor","The bill, please"],
            ["Quiero un té también","I want a tea too"],
          ],
        },
      ],
    },
    {
      title: "People & Numbers",
      description: "Count to ten, talk about family and describe things.",
      lessons: [
        {
          title: "Numbers 1–10",
          tip: "{Uno} becomes {un} before a masculine noun, and {una} before a feminine one: {un café}, {una manzana}.",
          words: [
            ["uno","one"],
            ["dos","two"],
            ["tres","three"],
            ["cuatro","four"],
            ["cinco","five"],
            ["seis","six"],
            ["siete","seven"],
            ["ocho","eight"],
            ["nueve","nine"],
            ["diez","ten"],
          ],
          sentences: [
            ["Tengo dos manzanas","I have two apples"],
            ["Cinco cafés, por favor","Five coffees, please"],
          ],
        },
        {
          title: "Family",
          tip: "The masculine plural covers mixed groups. {Los padres} means the parents.",
          words: [
            ["la madre","the mother"],
            ["el padre","the father"],
            ["el hermano","the brother"],
            ["la hermana","the sister"],
            ["el hijo","the son"],
            ["la hija","the daughter"],
          ],
          sentences: [
            ["Mi madre se llama Ana","My mother is called Ana"],
            ["Tengo un hermano","I have a brother"],
          ],
        },
        {
          title: "Describing",
          tip: "Adjectives usually come after the noun and match it: {el gato pequeño}, {la casa pequeña}.",
          words: [
            ["grande","big"],
            ["pequeño","small"],
            ["bueno","good"],
            ["malo","bad"],
            ["feliz","happy"],
            ["cansado","tired",["cansada"]],
          ],
          sentences: [
            ["Estoy cansado","I am tired"],
            ["La casa es grande","The house is big"],
          ],
        },
      ],
    },
  ],
};

export const french: RawCourse = {
  id: "fr",
  name: "French",
  native: "Français",
  flag: "🇫🇷",
  voice: "fr-FR",
  units: [
    {
      title: "First Words",
      description: "Say hello, be polite and introduce yourself.",
      lessons: [
        {
          title: "Greetings",
          tip: "{S'il vous plaît} is the polite way to say please. With friends, say {s'il te plaît}.",
          words: [
            ["bonjour","hello"],
            ["au revoir","goodbye"],
            ["bonsoir","good evening"],
            ["bonne nuit","good night"],
            ["merci","thank you"],
            ["s'il vous plaît","please",["s'il te plaît"]],
          ],
          sentences: [
            ["Bonjour, merci beaucoup","Hello, thank you very much"],
            ["Merci, au revoir","Thank you, goodbye"],
          ],
        },
        {
          title: "Polite Phrases",
          tip: "A woman writes {désolée} with an extra letter, but it sounds exactly the same as {désolé}.",
          words: [
            ["oui","yes"],
            ["non","no"],
            ["de rien","you’re welcome"],
            ["pardon","excuse me"],
            ["désolé","sorry",["désolée"]],
            ["ça va?","how are you?"],
          ],
          sentences: [
            ["Non, merci","No, thank you"],
            ["Oui, ça va","Yes, I am fine"],
          ],
        },
        {
          title: "Introductions",
          tip: "{Tu} is informal. Use {vous} with strangers, older people, or more than one person.",
          words: [
            ["je","I"],
            ["tu","you"],
            ["je m'appelle","my name is"],
            ["je suis","I am"],
            ["enchanté","nice to meet you",["enchantée"]],
            ["comment tu t'appelles?","what is your name?"],
          ],
          sentences: [
            ["Bonjour, je m'appelle Marie","Hello, my name is Marie"],
            ["Enchanté, je suis Paul","Nice to meet you, I am Paul"],
          ],
        },
      ],
    },
    {
      title: "Food & Drink",
      description: "Order food and drinks at a café.",
      lessons: [
        {
          title: "Food",
          tip: "French nouns are masculine, with {le}, or feminine, with {la}. Before a vowel, both shorten: {l'eau}.",
          words: [
            ["le pain","the bread"],
            ["la pomme","the apple"],
            ["le fromage","the cheese"],
            ["le poulet","the chicken"],
            ["le riz","the rice"],
            ["la soupe","the soup"],
          ],
          sentences: [
            ["Je voudrais le pain","I would like the bread"],
            ["La soupe et le riz","The soup and the rice"],
          ],
        },
        {
          title: "Drinks",
          tip: "To ask for some of something, use {du}, {de la} or {de l'}: {du pain}, {de l'eau}.",
          words: [
            ["l'eau","the water"],
            ["le café","the coffee"],
            ["le thé","the tea"],
            ["le lait","the milk"],
            ["le vin","the wine"],
            ["le jus","the juice"],
          ],
          sentences: [
            ["Un café au lait","A coffee with milk"],
            ["De l'eau, s'il vous plaît","Some water, please"],
          ],
        },
        {
          title: "At the Café",
          tip: "{Je voudrais}, I would like, is the polite way to order. {Je veux}, I want, can sound blunt.",
          words: [
            ["je voudrais","I would like"],
            ["l'addition","the bill"],
            ["la table","the table"],
            ["combien ça coûte?","how much does it cost?"],
            ["délicieux","delicious"],
            ["aussi","also / too"],
          ],
          sentences: [
            ["L'addition, s'il vous plaît","The bill, please"],
            ["Je voudrais un thé aussi","I would like a tea too"],
          ],
        },
      ],
    },
    {
      title: "People & Numbers",
      description: "Count to ten, talk about family and describe things.",
      lessons: [
        {
          title: "Numbers 1–10",
          tip: "The last letter of {six}, {huit} and {dix} goes silent before a consonant: {six cafés}.",
          words: [
            ["un","one"],
            ["deux","two"],
            ["trois","three"],
            ["quatre","four"],
            ["cinq","five"],
            ["six","six"],
            ["sept","seven"],
            ["huit","eight"],
            ["neuf","nine"],
            ["dix","ten"],
          ],
          sentences: [
            ["J'ai deux pommes","I have two apples"],
            ["Cinq cafés, s'il vous plaît","Five coffees, please"],
          ],
        },
        {
          title: "Family",
          tip: "The word for my changes with the noun: {mon père}, {ma mère}, {mes parents}.",
          words: [
            ["la mère","the mother"],
            ["le père","the father"],
            ["le frère","the brother"],
            ["la sœur","the sister",["la soeur"]],
            ["le fils","the son"],
            ["la fille","the daughter"],
          ],
          sentences: [
            ["Ma mère s'appelle Marie","My mother is called Marie"],
            ["J'ai un frère","I have a brother"],
          ],
        },
        {
          title: "Describing",
          tip: "Most adjectives come after the noun, but short common ones come before it: {un petit café}.",
          words: [
            ["grand","big",["grande"]],
            ["petit","small",["petite"]],
            ["bon","good",["bonne"]],
            ["mauvais","bad",["mauvaise"]],
            ["heureux","happy",["heureuse"]],
            ["fatigué","tired",["fatiguée"]],
          ],
          sentences: [
            ["Je suis fatigué","I am tired"],
            ["La maison est grande","The house is big"],
          ],
        },
      ],
    },
  ],
};

export const german: RawCourse = {
  id: "de",
  name: "German",
  native: "Deutsch",
  flag: "🇩🇪",
  voice: "de-DE",
  units: [
    {
      title: "First Words",
      description: "Say hello, be polite and introduce yourself.",
      lessons: [
        {
          title: "Greetings",
          tip: "{Hallo} and {tschüss} are casual. {Auf Wiedersehen} is the polite goodbye.",
          words: [
            ["hallo","hello"],
            ["tschüss","goodbye",["tschüs","auf Wiedersehen"]],
            ["guten Morgen","good morning"],
            ["gute Nacht","good night"],
            ["danke","thank you"],
            ["bitte","please"],
          ],
          sentences: [
            ["Hallo, guten Morgen","Hello, good morning"],
            ["Danke, tschüss","Thank you, goodbye"],
          ],
        },
        {
          title: "Polite Phrases",
          tip: "{Bitte} does a lot of work. It means please, you're welcome, and pardon?",
          words: [
            ["ja","yes"],
            ["nein","no"],
            ["gern geschehen","you’re welcome",["bitte schön"]],
            ["Entschuldigung","excuse me"],
            ["es tut mir leid","I’m sorry"],
            ["wie geht's?","how are you?",["wie geht es dir?"]],
          ],
          sentences: [
            ["Nein, danke","No, thank you"],
            ["Ja, bitte","Yes, please"],
          ],
        },
        {
          title: "Introductions",
          tip: "{Du} is informal. With strangers and at work, use {Sie}.",
          words: [
            ["ich","I"],
            ["du","you"],
            ["ich heiße","my name is"],
            ["ich bin","I am"],
            ["freut mich","nice to meet you"],
            ["wie heißt du?","what is your name?"],
          ],
          sentences: [
            ["Hallo, ich heiße Anna","Hello, my name is Anna"],
            ["Freut mich, ich bin Max","Nice to meet you, I am Max"],
          ],
        },
      ],
    },
    {
      title: "Food & Drink",
      description: "Order food and drinks at a café.",
      lessons: [
        {
          title: "Food",
          tip: "German has three words for the: {der}, {die} and {das}. Always learn the noun together with its article.",
          words: [
            ["das Brot","the bread"],
            ["der Apfel","the apple"],
            ["der Käse","the cheese"],
            ["das Hähnchen","the chicken"],
            ["der Reis","the rice"],
            ["die Suppe","the soup"],
          ],
          sentences: [
            ["Ich möchte das Brot","I would like the bread"],
            ["Die Suppe und der Reis","The soup and the rice"],
          ],
        },
        {
          title: "Drinks",
          tip: "{Ein Kaffee} is a coffee. Germans often order with just the noun and {bitte}: {Wasser, bitte}.",
          words: [
            ["das Wasser","the water"],
            ["der Kaffee","the coffee"],
            ["der Tee","the tea"],
            ["die Milch","the milk"],
            ["der Wein","the wine"],
            ["der Saft","the juice"],
          ],
          sentences: [
            ["Ein Kaffee mit Milch","A coffee with milk"],
            ["Wasser, bitte","Water, please"],
          ],
        },
        {
          title: "At the Café",
          tip: "{Ich möchte}, I would like, is the standard polite way to order.",
          words: [
            ["ich möchte","I would like"],
            ["die Rechnung","the bill"],
            ["der Tisch","the table"],
            ["was kostet das?","how much is that?"],
            ["lecker","delicious"],
            ["auch","also / too"],
          ],
          sentences: [
            ["Die Rechnung, bitte","The bill, please"],
            ["Ich möchte auch einen Tee","I would like a tea too"],
          ],
        },
      ],
    },
    {
      title: "People & Numbers",
      description: "Count to ten, talk about family and describe things.",
      lessons: [
        {
          title: "Numbers 1–10",
          tip: "When counting, say {eins}. Before a noun, it becomes {ein} or {eine}: {ein Apfel}.",
          words: [
            ["eins","one"],
            ["zwei","two"],
            ["drei","three"],
            ["vier","four"],
            ["fünf","five"],
            ["sechs","six"],
            ["sieben","seven"],
            ["acht","eight"],
            ["neun","nine"],
            ["zehn","ten"],
          ],
          sentences: [
            ["Ich habe zwei Äpfel","I have two apples"],
            ["Fünf Kaffee, bitte","Five coffees, please"],
          ],
        },
        {
          title: "Family",
          tip: "The word for my follows the noun too: {mein Vater}, {meine Mutter}.",
          words: [
            ["die Mutter","the mother"],
            ["der Vater","the father"],
            ["der Bruder","the brother"],
            ["die Schwester","the sister"],
            ["der Sohn","the son"],
            ["die Tochter","the daughter"],
          ],
          sentences: [
            ["Meine Mutter heißt Anna","My mother is called Anna"],
            ["Ich habe einen Bruder","I have a brother"],
          ],
        },
        {
          title: "Describing",
          tip: "After {ist} or {bin}, adjectives never change: {Das Haus ist groß}. {Ich bin müde}.",
          words: [
            ["groß","big"],
            ["klein","small"],
            ["gut","good"],
            ["schlecht","bad"],
            ["glücklich","happy"],
            ["müde","tired"],
          ],
          sentences: [
            ["Ich bin müde","I am tired"],
            ["Das Haus ist groß","The house is big"],
          ],
        },
      ],
    },
  ],
};

export const RAW_COURSES: RawCourse[] = [spanish, french, german];
