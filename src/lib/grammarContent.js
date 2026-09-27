// Temario de gramática A1 → C1. Contenido original del artifact «Escalera de gramática»
// (claude.ai), copiado tal cual con extract_grammar.py; las unidades nuevas están en grammarExtra.js.
// Formato de cada unidad: id, lv, t (título), s (subtítulo), when[], f[] (fórmula), tbl{h,r},
// notes[], ex[[en, es]], err[[mal, bien, por qué]], tip, q[] (huecos [frase, [respuestas]] u
// opción múltiple {q, o[], a, why}). Los textos pueden llevar <b>, <i> y <mark>.

export const LEVELS = {
  A1:{name:"Principiante", desc:"Las piezas de base: ser/estar, presente y lo mínimo para presentarte y hablar de tu día a día."},
  A2:{name:"Básico", desc:"Contar lo que pasó, comparar, hablar de planes y moverte con cantidades y preposiciones."},
  B1:{name:"Intermedio", desc:"El salto grande: present perfect, condicionales, pasiva y frases más largas."},
  B2:{name:"Intermedio alto", desc:"El nivel del First: matices de tiempo, hipótesis en pasado, estilo indirecto y deducciones."},
  C1:{name:"Avanzado", desc:"Estructuras para sonar natural y formal: inversión, énfasis y frases compactas."}
};

export const UNITS = [
/* ---------- A1 ---------- */
{id:"u1",lv:"A1",t:"Verb to be",s:"Ser y estar en un solo verbo",
 when:["Decir quién eres, tu profesión o nacionalidad: <i>I'm a baker.</i>","Edad (en inglés la edad se <b>es</b>, no se <b>tiene</b>): <i>I'm 30.</i>","Estados y sensaciones: <i>We're tired. It's cold.</i>","Dónde está algo o alguien: <i>The keys are in the car.</i>"],
 f:["Sujeto","+","am / is / are"],
 tbl:{h:["","Afirmativa","Negativa","Pregunta"],r:[["I","I <mark>am</mark> (I'm)","I'm not","Am I?"],["He / She / It","She <mark>is</mark> (she's)","She isn't","Is she?"],["You / We / They","They <mark>are</mark> (they're)","They aren't","Are they?"]]},
 ex:[["I'm tired today.","Hoy estoy cansado."],["She's a baker.","Es panadera."],["We aren't at home.","No estamos en casa."],["Is it cold outside? — Yes, it is.","¿Hace frío fuera? — Sí."]],
 err:[["I have 30 years.","I'm 30.","La edad va con to be."],["Is cold today.","It's cold today.","En inglés el sujeto nunca desaparece: usa it."],["Yes, I'm.","Yes, I am.","Las respuestas cortas afirmativas no se contraen."]],
 tip:"Truco: si en español dices <b>ser</b>, <b>estar</b> o <b>tener</b> años/hambre/frío, casi siempre es <b>to be</b>: <i>I'm hungry</i> (tengo hambre).",
 q:[["My brother ___ a cook.",["is"]],["I ___ hungry. (negativa)",["am not","'m not"]],["___ they from Barcelona?",["are"]],["We ___ 25 and 27 years old.",["are"]],{q:"How old are you?",o:["I have 40 years.","I'm 40.","I'm 40 years."],a:1,why:"Se dice I'm 40 o I'm 40 years old."}]},

{id:"u2",lv:"A1",t:"Pronombres y posesivos",s:"I / me / my / mine",
 when:["<b>Sujeto</b> (antes del verbo): I, you, he, she, it, we, they.","<b>Objeto</b> (después del verbo o de una preposición): me, him, her, us, them.","<b>Adjetivo posesivo</b> + sustantivo: <i>my car</i>.","<b>Pronombre posesivo</b> sustituye al sustantivo: <i>It's mine.</i>"],
 tbl:{h:["Sujeto","Objeto","Adj. posesivo","Pron. posesivo"],r:[["I","me","my","mine"],["you","you","your","yours"],["he","him","his","his"],["she","her","her","hers"],["it","it","its","—"],["we","us","our","ours"],["they","them","their","theirs"]]},
 ex:[["She loves him.","Ella le quiere."],["This is my car. It's mine.","Este es mi coche. Es mío."],["Call us tomorrow.","Llámanos mañana."],["Their shop is next to ours.","Su tienda está al lado de la nuestra."]],
 err:[["María and his brother","María and her brother","El posesivo concuerda con quien posee (María = her), no con la cosa."],["The dog wants it's food.","The dog wants its food.","its = su (de una cosa/animal); it's = it is."],["Is a good idea.","It's a good idea.","Otra vez: el sujeto siempre aparece."]],
 q:[["Can you help ___? (a nosotros)",["us"]],["Anna lives with ___ parents.",["her"]],["This bag isn't mine, it's ___. (de él)",["his"]],["I don't know ___. (a ellos)",["them"]],{q:"The cat is playing with ___ toy.",o:["its","it's","his"],a:0,why:"Posesivo de it = its, sin apóstrofo."}]},

{id:"u3",lv:"A1",t:"Artículos y plurales",s:"a, an, the y cuándo no poner nada",
 when:["<b>a</b> + sonido de consonante, <b>an</b> + sonido de vocal. Cuenta el sonido, no la letra: <i>an hour, a university</i>.","<b>the</b> = algo concreto o ya mencionado: <i>The bread from this shop is great.</i>","<b>Sin artículo</b> para hablar en general: <i>I like bread. Life is hard.</i>","Las profesiones llevan a/an: <i>She's an engineer.</i>"],
 tbl:{h:["Regla del plural","Singular","Plural"],r:[["+ s","car","cars"],["-s, -sh, -ch, -x, -o → + es","box / potato","boxes / potatoes"],["consonante + y → -ies","city","cities"],["Irregulares","man / woman / child","men / women / children"],["","person / foot / tooth","people / feet / teeth"]]},
 ex:[["I'm an engineer.","Soy ingeniero."],["Life is short.","La vida es corta."],["The coffee here is excellent.","El café de aquí es excelente."],["There are three children in the park.","Hay tres niños en el parque."]],
 err:[["The life is hard.","Life is hard.","Para generalizar no se usa the."],["I'm engineer.","I'm an engineer.","Las profesiones llevan a/an."],["an university","a university","University empieza con sonido /ju/, que es de consonante."]],
 q:[["She's ___ architect.",["an"]],["It takes ___ hour to get there.",["an"]],["___ coffee in this café is excellent.",["the"]],["I have two ___. (child)",["children"]],["We need three ___. (box)",["boxes"]],{q:"Me encanta la música (en general).",o:["I love the music.","I love music."],a:1,why:"En general, sin artículo."}]},

{id:"u4",lv:"A1",t:"There is / There are",s:"Cómo se dice «hay»",
 when:["<b>There is</b> + singular o incontable: <i>There's a bakery.</i>","<b>There are</b> + plural: <i>There are two cafés.</i>","En pasado: <b>there was / there were</b>.","Nunca uses <i>have</i> para decir «hay»."],
 tbl:{h:["","Afirmativa","Negativa","Pregunta"],r:[["Singular","There's a bank.","There isn't any milk.","Is there a bank near here?"],["Plural","There are two cafés.","There aren't any chairs.","Are there any eggs?"]]},
 ex:[["There's a pharmacy on this street.","Hay una farmacia en esta calle."],["There are a lot of tourists in August.","En agosto hay muchos turistas."],["There wasn't any bread left.","No quedaba pan."],["Are there any questions?","¿Hay alguna pregunta?"]],
 err:[["Have a lot of people.","There are a lot of people.","«Hay» = there is/are."],["There is many cars.","There are many cars.","Plural → are."],["There are a lot of traffic.","There is a lot of traffic.","Traffic es incontable → is."]],
 q:[["___ a pharmacy on this street.",["there is","there's"]],["___ any tomatoes in the fridge?",["are there"]],["There ___ any bread. (negativa)",["isn't","is not"]],["There ___ a lot of people at the party yesterday.",["were"]],{q:"___ three people waiting.",o:["There is","There are","It has"],a:1}]},

{id:"u5",lv:"A1",t:"Present simple",s:"Rutinas, hábitos y verdades",
 when:["Hábitos y rutinas: <i>I get up at 5 every day.</i>","Verdades generales: <i>Water boils at 100 °C.</i>","Horarios fijos: <i>The shop opens at 7.</i>","Gustos y estados: <i>like, love, know, want, need</i>."],
 f:["Sujeto","+","verbo (+s en he/she/it)"],
 tbl:{h:["","Afirmativa","Negativa","Pregunta"],r:[["I / You / We / They","They <mark>work</mark>","They don't work","Do they work?"],["He / She / It","She <mark>works</mark>","She doesn't work","Does she work?"]]},
 notes:["3ª persona: <b>-s</b> (works), <b>-es</b> tras -s, -sh, -ch, -x, -o (watches, goes, does), consonante + y → <b>-ies</b> (studies). Irregular: have → <b>has</b>.","Adverbios de frecuencia (always, usually, often, sometimes, never) van <b>antes del verbo</b> principal, pero <b>después de to be</b>: <i>I always drink coffee. / She's never late.</i>"],
 ex:[["I get up at five every day.","Me levanto a las cinco cada día."],["He doesn't eat meat.","No come carne."],["Where do you live?","¿Dónde vives?"],["She usually walks to work.","Normalmente va andando al trabajo."]],
 err:[["She work in a shop.","She works in a shop.","He/she/it siempre lleva -s."],["Does she works?","Does she work?","La -s ya va en does; el verbo queda limpio."],["I no like fish.","I don't like fish.","La negación necesita don't/doesn't."],["Always I drink coffee.","I always drink coffee.","El adverbio va entre sujeto y verbo."]],
 tip:"Palabras clave: <i>always, usually, often, sometimes, never, every day, on Mondays, once a week</i>.",
 q:[["She ___ in a bakery. (work)",["works"]],["My father ___ TV every night. (watch)",["watches"]],["___ you like coffee?",["do"]],["He ___ fish. (not / eat)",["doesn't eat","does not eat"]],["Tom ___ English on Mondays. (study)",["studies"]],{q:"¿Cuál es correcta?",o:["She is always late.","She always is late.","Always she is late."],a:0,why:"Con to be, el adverbio va después."}]},

{id:"u6",lv:"A1",t:"Can / Can't",s:"Poder y saber hacer",
 when:["Habilidad: <i>I can swim.</i> (sé nadar)","Posibilidad: <i>You can pay by card.</i>","Pedir permiso o favores: <i>Can I sit here? Can you help me?</i>"],
 f:["Sujeto","+","can / can't","+","verbo (sin to)"],
 tbl:{h:["","Afirmativa","Negativa","Pregunta"],r:[["Todas las personas","I / she <mark>can</mark> swim","can't (cannot) swim","Can you swim?"]]},
 ex:[["My daughter can ride a bike.","Mi hija sabe ir en bici."],["Sorry, I can't come tomorrow.","Lo siento, mañana no puedo venir."],["Can I pay by card?","¿Puedo pagar con tarjeta?"]],
 err:[["She cans drive.","She can drive.","Can nunca lleva -s."],["I can to go.","I can go.","Después de can, verbo sin to."],["Do you can help me?","Can you help me?","Can hace la pregunta solo, sin do."]],
 q:[["My daughter ___ ride a bike. (poder)",["can"]],["Sorry, I ___ come tomorrow. (negativa)",["can't","cannot"]],["He can ___ three languages. (speak)",["speak"]],{q:"___ help me, please?",o:["Do you can","Can you","You can"],a:1}]},

{id:"u7",lv:"A1",t:"Present continuous",s:"Lo que pasa ahora mismo",
 when:["Acción en este momento: <i>I'm cooking.</i>","Situación temporal: <i>I'm living with my parents this month.</i>","Planes futuros ya organizados: <i>I'm meeting Ana tomorrow.</i>"],
 f:["Sujeto","+","am / is / are","+","verbo-ing"],
 tbl:{h:["","Afirmativa","Negativa","Pregunta"],r:[["I","I'm <mark>working</mark>","I'm not working","Am I working?"],["He / She / It","He's working","He isn't working","Is he working?"],["You / We / They","They're working","They aren't working","Are they working?"]]},
 notes:["-ing: make → <b>making</b> (se va la e), run → <b>running</b> (dobla la consonante final en sílaba corta), lie → <b>lying</b>.","<b>Verbos de estado</b> no van en continuo: know, like, love, want, need, believe, understand, mean."],
 ex:[["Be quiet! The baby is sleeping.","¡Silencio! El bebé está durmiendo."],["What are you doing?","¿Qué estás haciendo?"],["I'm not working today.","Hoy no trabajo."],["We're opening a new shop next month.","El mes que viene abrimos una tienda nueva."]],
 err:[["I working now.","I'm working now.","Falta am/is/are."],["I'm knowing the answer.","I know the answer.","Know es verbo de estado."],["Where you are going?","Where are you going?","En la pregunta, are va delante del sujeto."]],
 tip:"Palabras clave: <i>now, right now, at the moment, today, this week, Look!, Listen!</i>",
 q:[["Be quiet! The baby ___. (sleep)",["is sleeping","'s sleeping"]],["I ___ today. (not / work)",["am not working","'m not working"]],["What ___ right now? (you / do)",["are you doing"]],["They ___ in the park. (run)",["are running","'re running"]],{q:"I ___ what you mean.",o:["am understanding","understand"],a:1,why:"Understand es de estado: no va en -ing."}]},

/* ---------- A2 ---------- */
{id:"u8",lv:"A2",t:"Present simple vs continuous",s:"Siempre o ahora",
 when:["<b>Simple</b>: rutina, algo permanente, verdades, verbos de estado.","<b>Continuous</b>: ahora mismo, algo temporal, cambios en curso."],
 tbl:{h:["","Present simple","Present continuous"],r:[["Frecuencia","I <mark>work</mark> in a bakery.","This week I'm <mark>working</mark> in the shop."],["Permanente / temporal","He lives in Girona.","He's living in Madrid for a few months."],["Palabras clave","always, usually, every day","now, today, this week, at the moment"]]},
 ex:[["He usually drives, but today he's walking.","Normalmente conduce, pero hoy va andando."],["Prices are going up.","Los precios están subiendo."],["I don't understand this word.","No entiendo esta palabra."]],
 err:[["I'm liking this song.","I like this song.","Like es verbo de estado."],["Normally I'm getting up at 6.","I normally get up at 6.","Rutina → present simple."]],
 q:[["Water ___ at 100 °C. (boil)",["boils"]],["Look! It ___. (snow)",["is snowing","'s snowing"]],["I usually take the bus, but today I ___. (walk)",["am walking","'m walking"]],["She ___ the question. (not / understand)",["doesn't understand","does not understand"]],{q:"Why ___ at me like that?",o:["do you look","are you looking"],a:1,why:"Está pasando ahora."}]},

{id:"u9",lv:"A2",t:"Past simple",s:"Acciones terminadas",
 when:["Acciones acabadas en un momento concreto del pasado.","Palabras clave: <i>yesterday, last week, in 2019, two days ago</i>."],
 f:["Sujeto","+","verbo-ed / irregular"],
 tbl:{h:["","Afirmativa","Negativa","Pregunta"],r:[["To be","I / he <mark>was</mark>, we / they <mark>were</mark>","wasn't / weren't","Was he? Were they?"],["Resto de verbos","She <mark>worked</mark> / <mark>went</mark>","She didn't work / go","Did she work / go?"]]},
 notes:["Regulares: work → worked, live → lived, study → studied, stop → stopped.","Irregulares clave: go-<b>went</b>, have-<b>had</b>, make-<b>made</b>, buy-<b>bought</b>, see-<b>saw</b>, eat-<b>ate</b>, get-<b>got</b>, take-<b>took</b>, come-<b>came</b>, say-<b>said</b>, do-<b>did</b>, know-<b>knew</b>, think-<b>thought</b>, give-<b>gave</b>, find-<b>found</b>, leave-<b>left</b>, sell-<b>sold</b>, pay-<b>paid</b>."],
 ex:[["We went to London last summer.","Fuimos a Londres el verano pasado."],["She didn't call me yesterday.","Ayer no me llamó."],["Did you see the match?","¿Viste el partido?"],["I bought a new oven three years ago.","Compré un horno nuevo hace tres años."]],
 err:[["I didn't went.","I didn't go.","Con didn't, el verbo vuelve a su forma base."],["Did you saw it?","Did you see it?","Lo mismo en preguntas con did."],["before two days","two days ago","«Hace + tiempo» = tiempo + ago."]],
 q:[["We ___ to London last summer. (go)",["went"]],["She ___ me yesterday. (not / call)",["didn't call","did not call"]],["___ you see the match last night?",["did"]],["I ___ a new oven three years ago. (buy)",["bought"]],["They ___ very tired after the trip. (be)",["were"]],{q:"La vi hace dos días.",o:["I saw her before two days.","I saw her two days ago.","I have seen her two days ago."],a:1}]},

{id:"u10",lv:"A2",t:"Contables e incontables",s:"some, any, much, many",
 when:["<b>Contables</b> tienen plural: apple, chair, egg.","<b>Incontables</b> no tienen plural ni a/an: water, bread, money, information, advice, furniture, news."],
 tbl:{h:["","Contables","Incontables"],r:[["Afirmativa","some eggs / a lot of eggs","some milk / a lot of milk"],["Negativa y pregunta","any eggs / many eggs","any milk / much milk"],["¿Cuánto?","How <mark>many</mark> eggs?","How <mark>much</mark> milk?"],["Poco","a few eggs","a little milk"]]},
 notes:["<b>some</b> también en ofrecimientos y peticiones: <i>Would you like some coffee?</i>"],
 ex:[["We don't have any milk.","No tenemos leche."],["How many people work here?","¿Cuánta gente trabaja aquí?"],["Can I give you some advice?","¿Te puedo dar un consejo?"],["The news is good.","Las noticias son buenas."]],
 err:[["informations","information","Incontable: nunca plural."],["an advice","some advice / a piece of advice","Incontable: sin a/an."],["How much eggs?","How many eggs?","Eggs se cuenta."]],
 q:[["We don't have ___ milk.",["any"]],["How ___ people work here?",["many"]],["Would you like ___ coffee?",["some"]],["I don't have ___ time.",["much"]],{q:"Can you give me some ___?",o:["advices","advice"],a:1}]},

{id:"u11",lv:"A2",t:"Comparativos y superlativos",s:"bigger, the best, as good as",
 tbl:{h:["Tipo","Adjetivo","Comparativo","Superlativo"],r:[["1 sílaba","cheap","cheap<mark>er</mark> than","the cheap<mark>est</mark>"],["Dobla consonante","big","bigger","the biggest"],["Acaba en -y","easy","easier","the easiest"],["2+ sílabas","expensive","<mark>more</mark> expensive","the <mark>most</mark> expensive"],["Irregulares","good / bad / far","better / worse / further","the best / the worst / the furthest"]]},
 when:["Igualdad: <b>as … as</b>: <i>This bread is as good as yours.</i>","Desigualdad suave: <b>not as … as</b>."],
 ex:[["My car is faster than yours.","Mi coche es más rápido que el tuyo."],["This is the best croissant in town.","Es el mejor cruasán de la ciudad."],["Madrid isn't as expensive as London.","Madrid no es tan caro como Londres."]],
 err:[["more big","bigger","Adjetivos cortos: -er."],["more better","better","Better ya es comparativo."],["bigger that","bigger than","«Que» en comparaciones = than."]],
 q:[["My car is ___ than yours. (fast)",["faster"]],["This is the ___ croissant in town. (good)",["best"]],["Madrid is ___ than Valencia. (expensive)",["more expensive"]],["Today is ___ day of the year. (hot)",["the hottest"]],{q:"She's taller ___ her sister.",o:["that","than","as"],a:1}]},

{id:"u12",lv:"A2",t:"Futuro: will y going to",s:"Decisiones, planes y predicciones",
 tbl:{h:["Forma","Úsala para","Ejemplo"],r:[["will + verbo","Decisión en el momento, promesas, ofrecimientos, opiniones","I'll help you. I think it will rain."],["be going to + verbo","Planes ya decididos, predicción con evidencia","I'm going to open a second shop. Look! It's going to rain."],["Present continuous","Citas y planes fijados","I'm seeing the doctor on Monday."]]},
 when:["Negativa: <b>won't</b> / <b>am not going to</b>."],
 ex:[["The phone is ringing. — I'll answer it.","Suena el teléfono. — Ya lo cojo yo."],["We're going to paint the shop in August.","Vamos a pintar la tienda en agosto."],["I promise I won't be late.","Te prometo que no llegaré tarde."]],
 err:[["I will to go.","I'll go.","Will + verbo sin to."],["The phone is ringing. — I'm going to answer it.","— I'll answer it.","Decisión tomada en ese momento → will."],["Tomorrow I go to the dentist.","Tomorrow I'm going to the dentist.","Cita fijada → present continuous."]],
 q:[["A: I'm cold. B: I ___ the window. (close)",["will close","'ll close"]],["Look at those clouds! It ___. (rain)",["is going to rain","'s going to rain"]],["We ___ on holiday this year. We've decided. (not / go)",["are not going to go","aren't going to go","'re not going to go"]],{q:"I think Spain ___ win the match.",o:["will","is going"],a:0,why:"Opinión con I think → will."}]},

{id:"u13",lv:"A2",t:"Preposiciones in, on, at",s:"Tiempo y lugar",
 tbl:{h:["","AT (punto)","ON (superficie / día)","IN (dentro / periodo)"],r:[["Tiempo","at 5 o'clock, at night, at the weekend","on Monday, on 3 May, on my birthday","in July, in 2020, in summer, in the morning"],["Lugar","at home, at work, at the door, at the bus stop","on the table, on the wall, on the second floor","in the kitchen, in Barcelona, in Spain"]]},
 ex:[["The shop opens at 7 a.m.","La tienda abre a las 7."],["See you on Friday!","¡Nos vemos el viernes!"],["My birthday is in June.","Mi cumpleaños es en junio."]],
 err:[["in Monday","on Monday","Días → on."],["in the night","at night","Expresión fija."],["I'm in home.","I'm at home.","Home, work, school → at."],["arrive to Madrid","arrive in Madrid","Arrive in (ciudad/país), arrive at (edificio). Nunca arrive to."]],
 q:[["The shop opens ___ 7 a.m.",["at"]],["My birthday is ___ June.",["in"]],["See you ___ Friday!",["on"]],["She's ___ work right now.",["at"]],["The keys are ___ the table.",["on"]],{q:"We arrived ___ Paris late.",o:["to","in","at"],a:1}]},

/* ---------- B1 ---------- */
{id:"u14",lv:"B1",t:"Past continuous",s:"Lo que estaba pasando",
 when:["Acción en progreso en un momento del pasado: <i>At 8 p.m. we were having dinner.</i>","Acción larga interrumpida por otra corta (past simple): <i>I was baking when the phone rang.</i>","Describir el escenario de una historia."],
 f:["Sujeto","+","was / were","+","verbo-ing"],
 ex:[["I was baking when the phone rang.","Estaba horneando cuando sonó el teléfono."],["While she was driving, it started to rain.","Mientras conducía, empezó a llover."],["What were you doing at 10 last night?","¿Qué hacías anoche a las 10?"]],
 err:[["While I cooked, the phone was ringing.","While I was cooking, the phone rang.","La larga va en continuous; la que interrumpe, en simple."],["I was knowing him.","I knew him.","Verbos de estado no van en continuo."]],
 tip:"<b>when</b> suele ir con la acción corta (past simple); <b>while</b> con la larga (past continuous).",
 q:[["I ___ when you called. (sleep)",["was sleeping"]],["What ___ at 10 last night? (you / do)",["were you doing"]],["They ___ to the teacher. (not / listen)",["weren't listening","were not listening"]],["She was walking home when she ___ an accident. (see)",["saw"]],{q:"While we ___ TV, the lights went out.",o:["watched","were watching","are watching"],a:1}]},

{id:"u15",lv:"B1",t:"Present perfect",s:"El pasado que conecta con ahora",
 when:["Experiencias en la vida, sin decir cuándo: <i>Have you ever been to London?</i>","Pasado con resultado ahora: <i>I've lost my keys.</i> (y no las tengo)","Con <b>just</b>, <b>already</b>, <b>yet</b>.","Periodos que no han terminado: <i>today, this week, this year</i>."],
 f:["Sujeto","+","have / has","+","participio"],
 tbl:{h:["","Afirmativa","Negativa","Pregunta"],r:[["I / You / We / They","I've <mark>finished</mark>","I haven't finished","Have you finished?"],["He / She / It","She's <mark>finished</mark>","She hasn't finished","Has she finished?"]]},
 notes:["Participios irregulares: be-<b>been</b>, go-<b>gone</b>, do-<b>done</b>, see-<b>seen</b>, eat-<b>eaten</b>, write-<b>written</b>, take-<b>taken</b>, make-<b>made</b>, buy-<b>bought</b>.","<b>just / already</b> van entre have y el participio; <b>yet</b> al final, en negativas y preguntas.","<b>been</b> vs <b>gone</b>: <i>She's been to Paris</i> (fue y volvió) / <i>She's gone to Paris</i> (está allí ahora)."],
 ex:[["I've never been to Japan.","Nunca he estado en Japón."],["She's just left.","Se acaba de ir."],["Have you finished yet?","¿Ya has terminado?"],["We've sold all the croissants.","Hemos vendido todos los cruasanes."]],
 err:[["I have seen him yesterday.","I saw him yesterday.","Con un momento terminado (yesterday) → past simple."],["Have you ever went…?","Have you ever been…?","Participio, no pasado."],["I didn't finish yet.","I haven't finished yet.","Yet va con present perfect."]],
 q:[["I ___ to Japan. (never / be)",["have never been","'ve never been"]],["She ___. (just / leave)",["has just left","'s just left"]],["___ you finished yet?",["have"]],["They haven't called ___.",["yet"]],{q:"Where's Tom? — He ___ to the bank.",o:["has been","has gone"],a:1,why:"Está allí ahora → gone."}]},

{id:"u16",lv:"B1",t:"Present perfect vs past simple",s:"Y el lío de for / since",
 when:["<b>Past simple</b>: momento terminado y concreto (yesterday, in 2010, ago, last…).","<b>Present perfect</b>: sin momento, o un periodo que llega hasta hoy.","<b>for</b> + duración (for ten years). <b>since</b> + punto de inicio (since 2015, since Monday)."],
 tbl:{h:["Español","Inglés"],r:[["Vivo aquí desde 2015.","I<mark>'ve lived</mark> here since 2015."],["La conozco desde hace años.","I<mark>'ve known</mark> her for years."],["Viví en Londres dos años (ya no).","I lived in London for two years."]]},
 ex:[["We've had this shop since 1998.","Tenemos esta tienda desde 1998."],["I saw that film last week.","Vi esa película la semana pasada."],["How long have you known each other?","¿Desde cuándo os conocéis?"]],
 err:[["I live here since 2015.","I've lived here since 2015.","Donde el español usa presente + desde, el inglés usa present perfect."],["I know her for years.","I've known her for years.","Mismo caso."],["since three years","for three years","Duración → for."]],
 q:[["We ___ this shop since 1998. (have)",["have had","'ve had"]],["I've worked here ___ five years.",["for"]],["She's been ill ___ Monday.",["since"]],["I ___ that film last week. (see)",["saw"]],{q:"How long ___ each other?",o:["do you know","have you known","did you know"],a:1}]},

{id:"u17",lv:"B1",t:"Obligación y consejo",s:"must, have to, should, mustn't",
 tbl:{h:["Forma","Significado","Ejemplo"],r:[["must","Obligación que siente quien habla, normas","I must call my mum."],["have to","Obligación externa","I have to wear a uniform."],["mustn't","Prohibido","You mustn't smoke here."],["don't have to","No hace falta (¡no es prohibición!)","You don't have to pay, it's free."],["should / shouldn't","Consejo","You should rest."],["had to","Pasado de must y have to","Yesterday I had to work."]]},
 ex:[["You mustn't touch the oven.","No toques el horno (está prohibido)."],["It's Sunday, so I don't have to get up early.","Es domingo, no tengo que madrugar."],["You look tired. You should go to bed.","Pareces cansado. Deberías irte a dormir."]],
 err:[["You don't have to smoke here. (= prohibido)","You mustn't smoke here.","Don't have to = no es necesario."],["I must to go.","I must go.","Modal + verbo sin to."],["Yesterday I must work.","Yesterday I had to work.","Must no tiene pasado: had to."]],
 q:[["You ___ touch the oven. It's very hot! (prohibido)",["mustn't","must not"]],["You look tired. You ___ go to bed.",["should"]],["Last year I ___ work every weekend. (tener que)",["had to"]],["Does she ___ wear a uniform?",["have to"]],{q:"It's Sunday, so I ___ get up early.",o:["mustn't","don't have to"],a:1}]},

{id:"u18",lv:"B1",t:"Condicionales 0, 1 y 2",s:"Si pasa esto…",
 tbl:{h:["Tipo","Estructura","Uso","Ejemplo"],r:[["Zero","If + present, present","Verdades, siempre pasa","If you heat ice, it melts."],["First","If + present, will + verbo","Real, posible","If it rains, I'll stay at home."],["Second","If + past simple, would + verbo","Hipotético, improbable","If I had more time, I'd learn Japanese."]]},
 notes:["En el second conditional, <b>were</b> vale para todas las personas: <i>If I were you, I'd…</i>","Nunca pongas <b>will</b> ni <b>would</b> en la parte del <b>if</b>."],
 ex:[["If it rains, I'll stay at home.","Si llueve, me quedaré en casa."],["If I won the lottery, I'd travel the world.","Si me tocara la lotería, viajaría por el mundo."],["If I were you, I'd accept.","Yo que tú, aceptaría."]],
 err:[["If it will rain, I'll stay.","If it rains, I'll stay.","Sin will en la parte del if."],["If I would have money…","If I had money…","Sin would en la parte del if."],["If I was you…","If I were you…","Were es la forma correcta en exámenes."]],
 q:[["If you ___ red and white, you get pink. (mix)",["mix"]],["If it ___ tomorrow, we'll cancel the trip. (rain)",["rains"]],["If I ___ the lottery, I would travel the world. (win)",["won"]],["If she studied more, she ___. (pass)",["would pass","'d pass"]],{q:"If I ___ you, I'd accept the offer.",o:["am","were","would be"],a:1}]},

{id:"u19",lv:"B1",t:"La pasiva",s:"Cuando importa lo que se hace, no quién",
 when:["Cuando la acción o el objeto importan más que quien lo hace.","Si quieres decir quién lo hizo: <b>by</b> + persona."],
 f:["Objeto","+","be (en su tiempo)","+","participio"],
 tbl:{h:["Tiempo","Ejemplo"],r:[["Present simple","Bread <mark>is made</mark> every morning."],["Past simple","The shop <mark>was opened</mark> in 1950."],["Present perfect","The order <mark>has been sent</mark>."],["Future","It <mark>will be delivered</mark> tomorrow."],["Modal","It <mark>must be done</mark> today."]]},
 ex:[["English is spoken here.","Aquí se habla inglés."],["The Sagrada Família was designed by Gaudí.","La Sagrada Família fue diseñada por Gaudí."],["Your order has been sent.","Tu pedido ha sido enviado."]],
 err:[["The bread is make.","The bread is made.","Participio, no infinitivo."],["It was builded.","It was built.","Build es irregular."]],
 tip:"Muchas frases con <b>«se»</b> en español se traducen con pasiva: <i>Se vende piso</i> → <i>Flat for sale / A flat is being sold</i>.",
 q:[["Croissants ___ with butter. (make)",["are made"]],["This church ___ in 1882. (build)",["was built"]],["The letters ___ yesterday. (send)",["were sent"]],["Your order ___ tomorrow. (deliver)",["will be delivered"]],{q:"Somebody stole my bike.",o:["My bike was stolen.","My bike stole.","My bike was stole."],a:0}]},

{id:"u20",lv:"B1",t:"Oraciones de relativo",s:"who, which, that, where, whose",
 tbl:{h:["Pronombre","Para","Ejemplo"],r:[["who","personas","The woman who lives next door…"],["which","cosas","The car which I bought…"],["that","personas o cosas (sin comas)","The cake that you made…"],["where","lugares","The town where I was born…"],["whose","posesión (cuyo)","The man whose car was stolen…"]]},
 notes:["<b>Sin comas</b> (información necesaria): puedes quitar el pronombre si es objeto: <i>The book (that) I bought.</i>","<b>Con comas</b> (información extra): nunca uses that: <i>My mother, who is 70, still works.</i>"],
 ex:[["The woman who lives next door is a doctor.","La mujer que vive al lado es médica."],["This is the town where I was born.","Este es el pueblo donde nací."],["Barcelona, which is in Catalonia, is very touristy.","Barcelona, que está en Cataluña, es muy turística."]],
 err:[["The man which…","The man who…","Personas → who."],["My car, that is red, …","My car, which is red, …","Con comas no se usa that."],["The book that I read it.","The book that I read.","No repitas el objeto."]],
 q:[["The woman ___ lives next door is a doctor.",["who","that"]],["This is the town ___ I was born.",["where"]],["That's the man ___ car was stolen.",["whose"]],["Barcelona, ___ is in Catalonia, is very touristy.",["which"]],{q:"The cake ___ you made was delicious.",o:["who","which it","that"],a:2}]},

{id:"u21",lv:"B1",t:"Gerundio o infinitivo",s:"-ing o to + verbo",
 tbl:{h:["Forma","Cuándo","Ejemplo"],r:[["-ing","Después de preposición","I'm interested in learning."],["-ing","Como sujeto","Swimming is good for you."],["-ing","Tras enjoy, mind, finish, avoid, suggest, keep, can't stand, look forward to","I enjoy cooking."],["to + verbo","Finalidad (para)","I came to help."],["to + verbo","Tras want, need, decide, hope, plan, promise, learn, would like, afford, manage","We decided to open on Sundays."],["to + verbo","Tras adjetivos","It's easy to understand."]]},
 notes:["Cambian de significado: <b>stop smoking</b> (dejar de fumar) / <b>stop to smoke</b> (parar para fumar); <b>remember to call</b> (acordarse de llamar) / <b>remember calling</b> (recordar haber llamado)."],
 ex:[["I'm looking forward to seeing you.","Tengo ganas de verte."],["She's good at baking.","Se le da bien hornear."],["I went there to buy bread.","Fui a comprar pan."]],
 err:[["I enjoy to cook.","I enjoy cooking.","Enjoy + -ing."],["I'm looking forward to see you.","…to seeing you.","Aquí to es preposición → -ing."],["I went there for buy bread.","I went there to buy bread.","Finalidad = to."]],
 q:[["I want ___ English. (learn)",["to learn"]],["She's good at ___. (bake)",["baking"]],["Do you mind ___ a moment? (wait)",["waiting"]],["We decided ___ on Sundays. (open)",["to open"]],{q:"I'm looking forward to ___ you.",o:["see","seeing"],a:1}]},

/* ---------- B2 ---------- */
{id:"u22",lv:"B2",t:"Present perfect continuous",s:"Cuánto tiempo llevas haciendo algo",
 when:["Acción que empezó en el pasado y sigue (o acaba de terminar), destacando la <b>duración</b>.","Resultado visible de una actividad reciente: <i>You're wet! — I've been running.</i>","Con <b>How long…?</b>"],
 f:["Sujeto","+","have / has been","+","verbo-ing"],
 tbl:{h:["Simple (resultado, cantidad)","Continuous (actividad, duración)"],r:[["I've baked 200 loaves.","I've been baking all morning."],["She's written three emails.","She's been writing emails for hours."]]},
 ex:[["I've been waiting for 40 minutes!","¡Llevo 40 minutos esperando!"],["How long have you been learning English?","¿Cuánto tiempo llevas aprendiendo inglés?"],["She's tired because she's been working all day.","Está cansada porque ha estado trabajando todo el día."]],
 err:[["I'm waiting for an hour.","I've been waiting for an hour.","«Llevo + tiempo + -ando» = present perfect continuous."],["I've been knowing her for years.","I've known her for years.","Verbos de estado → forma simple."]],
 q:[["I ___ for you for 40 minutes! (wait)",["have been waiting","'ve been waiting"]],["How long ___ English? (you / learn)",["have you been learning"]],["She's tired because she ___ all day. (work)",["has been working","'s been working"]],{q:"I ___ three emails this morning.",o:["have been writing","have written"],a:1,why:"Cantidad terminada → simple."}]},

{id:"u23",lv:"B2",t:"Past perfect",s:"El pasado del pasado",
 when:["Algo que ocurrió <b>antes</b> de otro momento del pasado.","Palabras clave: <i>by the time, before, after, already, when</i>.","<b>Past perfect continuous</b> (had been + -ing): duración hasta ese momento pasado."],
 f:["Sujeto","+","had","+","participio"],
 ex:[["When I arrived, the train had left.","Cuando llegué, el tren ya se había ido."],["She had never seen snow before that trip.","Nunca había visto nieve antes de ese viaje."],["I had been waiting for an hour when he arrived.","Llevaba una hora esperando cuando llegó."]],
 err:[["When I arrived, the train left.","When I arrived, the train had left.","Sin had parece que salió justo al llegar tú."],["I had went.","I had gone.","Participio."]],
 q:[["When we got to the cinema, the film ___. (already / start)",["had already started"]],["I ___ before 2010. (never / fly)",["had never flown"]],["She was tired because she ___ all night. (work)",["had been working","had worked"]],{q:"After he ___ dinner, he went out.",o:["had had","has had"],a:0}]},

{id:"u24",lv:"B2",t:"Tercer condicional y mixtos",s:"Lo que habría pasado",
 tbl:{h:["Tipo","Estructura","Ejemplo"],r:[["Third","If + past perfect, would have + participio","If I had known, I would have come."],["Mixto pasado → presente","If + past perfect, would + verbo","If I had studied medicine, I would be a doctor now."],["Mixto presente → pasado","If + past simple, would have + participio","If I were more organised, I wouldn't have missed the deadline."]]},
 notes:["Puedes cambiar would por <b>could have</b> o <b>might have</b>."],
 ex:[["If you had told me, I would have helped you.","Si me lo hubieras dicho, te habría ayudado."],["If we had left earlier, we wouldn't have missed the train.","Si hubiéramos salido antes, no habríamos perdido el tren."]],
 err:[["If I would have known…","If I had known…","Sin would en la parte del if."],["I would came.","I would have come.","Would have + participio."]],
 q:[["If you ___ me, I would have helped you. (tell)",["had told"]],["If we had left earlier, we ___ the train. (not / miss)",["wouldn't have missed","would not have missed"]],["If I had saved more money, I ___ rich now. (be)",["would be","'d be"]],{q:"If she ___ harder, she would have passed.",o:["had studied","would have studied","studied"],a:0}]},

{id:"u25",lv:"B2",t:"Estilo indirecto",s:"Contar lo que dijo otro",
 tbl:{h:["Dijo (directo)","Dijo que… (indirecto)"],r:[["present simple: “I'm tired.”","past simple: she said she was tired."],["present continuous","past continuous"],["present perfect / past simple","past perfect"],["will","would"],["can","could"],["must","had to"]]},
 notes:["Referencias: today → that day, tomorrow → the next day, yesterday → the day before, here → there.","<b>say</b> something / <b>tell</b> somebody something.","Preguntas: orden de afirmación + if/whether: <i>She asked me where I lived.</i>","Órdenes: tell/ask + (not) to: <i>He told me not to be late.</i>"],
 ex:[["He said he would call me.","Dijo que me llamaría."],["She asked me if I liked coffee.","Me preguntó si me gustaba el café."],["He told me to close the door.","Me dijo que cerrara la puerta."]],
 err:[["He said me…","He told me…","Tell + persona."],["She asked me where did I live.","She asked me where I lived.","Sin orden de pregunta."],["He told that…","He said that…","Say sin persona."]],
 q:[["“I'm tired.” → She said she ___ tired.",["was"]],["“I will call you.” → He said he ___ call me.",["would"]],["“Do you like coffee?” → She asked me ___ I liked coffee.",["if","whether"]],["“Don't be late.” → He told me ___ be late.",["not to"]],{q:"She ___ me that she was leaving.",o:["said","told"],a:1}]},

{id:"u26",lv:"B2",t:"Modales de deducción",s:"Debe de ser, puede que, no puede ser",
 tbl:{h:["Certeza","Presente","Pasado"],r:[["Seguro que sí","must be","must have been"],["Posible","might / may / could be","might / may / could have been"],["Seguro que no","can't be","can't have been"]]},
 ex:[["She must be at home — the lights are on.","Debe de estar en casa: hay luz."],["He can't have finished already.","No puede haber terminado ya."],["They might have missed the bus.","Puede que hayan perdido el bus."]],
 err:[["He mustn't be at home. (deducción)","He can't be at home.","Para deducir que no, se usa can't."],["She must have went.","She must have gone.","Participio."]],
 q:[["He's been working 12 hours. He ___ be exhausted.",["must"]],["I'm not sure where Ana is. She ___ be in the kitchen.",["might","may","could"]],["That ___ be Tom — he's in Paris.",["can't","cannot"]],["The floor is wet. It must ___. (rain)",["have rained"]],{q:"I can't find my keys. I ___ left them at work.",o:["must have","must","mustn't have"],a:0}]},

{id:"u27",lv:"B2",t:"used to / be used to / get used to",s:"Solía, estoy acostumbrado, me acostumbro",
 tbl:{h:["Forma","Significado","Ejemplo"],r:[["used to + verbo","Solía (ya no)","I used to smoke."],["didn't use to + verbo","No solía","She didn't use to like coffee."],["be used to + -ing","Estar acostumbrado","I'm used to getting up early."],["get used to + -ing","Acostumbrarse","You'll get used to it."],["would + verbo","Acciones repetidas en el pasado (no estados)","We would play in the street."]]},
 ex:[["When I was a child, I used to live in a village.","De niño vivía en un pueblo."],["It took me months to get used to driving on the left.","Me costó meses acostumbrarme a conducir por la izquierda."]],
 err:[["I'm used to get up early.","I'm used to getting up early.","Be used to + -ing."],["I use to go to the gym. (presente)","I usually go to the gym.","Used to es solo pasado."],["I didn't used to…","I didn't use to…","Con didn't, sin -d."]],
 q:[["When I was a child, I ___ in a village. (live)",["used to live"]],["I'm used to ___ at night. (work)",["working"]],["It took me months to get used to ___ on the left. (drive)",["driving"]],["She ___ coffee, but now she loves it. (not / like)",["didn't use to like","did not use to like"]],{q:"Don't worry, you'll soon ___ the new schedule.",o:["used to","get used to","be use to"],a:1}]},

{id:"u28",lv:"B2",t:"wish / if only",s:"Deseos y arrepentimientos",
 tbl:{h:["Estructura","Uso","Ejemplo"],r:[["wish + past simple","Deseo sobre el presente","I wish I had more time."],["wish + past perfect","Arrepentimiento sobre el pasado","I wish I had studied more."],["wish + would","Quejarte de lo que hace otro","I wish you would stop shouting."]]},
 notes:["<b>If only</b> funciona igual, pero con más emoción."],
 ex:[["I wish I spoke English fluently.","Ojalá hablara inglés con fluidez."],["I wish I hadn't eaten so much.","Ojalá no hubiera comido tanto."]],
 err:[["I wish I have more time.","I wish I had more time.","Se retrocede un tiempo."],["I wish I would be taller.","I wish I were taller.","No uses would con tu propio sujeto."]],
 q:[["I wish I ___ English fluently. (speak)",["spoke","could speak"]],["I wish I ___ so much yesterday. (not / eat)",["hadn't eaten","had not eaten"]],["I wish it ___ raining. (stop)",["would stop"]],{q:"If only I ___ the answer!",o:["know","knew","would know"],a:1}]},

{id:"u29",lv:"B2",t:"Future continuous y future perfect",s:"Estaré haciendo, habré hecho",
 tbl:{h:["Forma","Uso","Ejemplo"],r:[["will be + -ing","Acción en progreso en un momento futuro","This time tomorrow I'll be flying to London."],["will have + participio","Acción terminada antes de un momento futuro","By 2030 I will have paid off the loan."]]},
 notes:["<b>by</b> + momento (by Friday, by the time…) suele pedir future perfect."],
 ex:[["Don't call at 9 — I'll be having dinner.","No llames a las 9, estaré cenando."],["By the time you arrive, we'll have finished.","Cuando llegues, ya habremos terminado."]],
 err:[["By Friday I will finish.","By Friday I will have finished.","By + momento → future perfect."]],
 q:[["Don't call at 9 — I ___ dinner. (have)",["will be having","'ll be having"]],["By the time you arrive, we ___. (finish)",["will have finished","'ll have finished"]],["This time next week, I ___ on a beach. (lie)",["will be lying","'ll be lying"]],{q:"By 2030, we ___ three new shops.",o:["will open","will have opened","will be opening"],a:1}]},

/* ---------- C1 ---------- */
{id:"u30",lv:"C1",t:"Inversión",s:"Never have I seen…",
 when:["Tras expresiones negativas o restrictivas al principio de la frase, el auxiliar va <b>antes</b> del sujeto, como en una pregunta.","Muy usado en inglés escrito y formal (y en el Advanced)."],
 tbl:{h:["Expresión","Ejemplo"],r:[["Never / Rarely / Seldom","Never <mark>have I</mark> seen such a mess."],["Not only … but also","Not only <mark>does he</mark> bake, but he also designs cakes."],["Hardly … when / No sooner … than","No sooner <mark>had we</mark> sat down than the phone rang."],["Under no circumstances","Under no circumstances <mark>should you</mark> open the door."],["Only then / Little","Little <mark>did they</mark> know…"],["Condicional sin if","<mark>Had I</mark> known (= If I had known), <mark>Should you</mark> need help (= If you need)…"]]},
 ex:[["Rarely do we see such talent.","Rara vez vemos tanto talento."],["Had I known, I would have come.","De haberlo sabido, habría venido."]],
 err:[["Never I have seen…","Never have I seen…","Auxiliar antes del sujeto."],["Not only he speaks…","Not only does he speak…","Si no hay auxiliar, añade do/does/did."]],
 q:[["Never ___ I tasted such good bread.",["have"]],["Not only ___ she bake, she also designs cakes.",["does"]],["___ I known, I would have come.",["had"]],["No sooner had we sat down ___ the phone rang.",["than"]],{q:"Rarely ___ such talent.",o:["we see","do we see","we do see"],a:1}]},

{id:"u31",lv:"C1",t:"Frases escindidas",s:"Para poner el foco: What I need is…",
 tbl:{h:["Estructura","Ejemplo","Enfatiza"],r:[["It is / was … who / that","It was Marta who called (not Pedro).","Quién o qué"],["What … is / was","What I need is a holiday.","La idea"],["All … is","All I want is a quiet weekend.","Lo único"],["The reason why … is that","The reason why I left is that I was tired.","El motivo"]]},
 ex:[["What I love about Barcelona is the sea.","Lo que me encanta de Barcelona es el mar."],["It was my grandfather who opened the bakery.","Fue mi abuelo quien abrió la panadería."]],
 err:[["What I need it's a holiday.","What I need is a holiday.","Sin it."],["Is my brother who…","It's my brother who…","Siempre con it."]],
 q:[["___ was my grandfather who opened the bakery.",["it"]],["___ I love about Barcelona is the sea.",["what"]],["All I want ___ a quiet weekend.",["is"]],{q:"What she did ___ call the police.",o:["was","it was","is that"],a:0}]},

{id:"u32",lv:"C1",t:"Participle clauses",s:"Frases más compactas",
 tbl:{h:["Forma","Sustituye a","Ejemplo"],r:[["-ing","Acción activa, a la vez","Walking home, I met Ana. (= While I was walking)"],["Participio","Idea pasiva","Made with local flour, our bread… (= Because it's made)"],["Having + participio","Acción anterior","Having finished the course, she got a job."],["Relativa reducida","who is / which was…","The man sitting there is my uncle."]]},
 notes:["El sujeto de las dos partes tiene que ser el mismo. <i>Walking to work, the rain started</i> es un error: la lluvia no camina."],
 ex:[["Having finished his work, he went home.","Tras terminar su trabajo, se fue a casa."],["Baked in a wood oven, this bread has a special taste.","Horneado en horno de leña, este pan tiene un sabor especial."]],
 err:[["Walking to work, the rain started.","Walking to work, I got caught in the rain.","Mismo sujeto en las dos partes."],["Having send the email…","Having sent the email…","Participio."]],
 q:[["___ his work, he went home. (finish)",["having finished"]],["___ in a wood oven, this bread has a special taste. (bake)",["baked"]],["The woman ___ by the door is my aunt. (stand)",["standing"]],{q:"___ the email, I realised I had made a mistake.",o:["Having sent","Sent","Having send"],a:0}]},

{id:"u33",lv:"C1",t:"Causativa y pasiva avanzada",s:"have something done, It is said that…",
 tbl:{h:["Estructura","Uso","Ejemplo"],r:[["have / get + objeto + participio","Otra persona lo hace por ti","I had my car repaired."],["It is said / believed that…","Opinión general, impersonal","It is said that the recipe is 100 years old."],["Sujeto + is said to + verbo","Lo mismo, más compacto","He is said to be the best baker in town."],["… to have + participio","Referido al pasado","The company is believed to have lost money."]]},
 ex:[["I'm going to have my hair cut.","Voy a cortarme el pelo (en la peluquería)."],["We had the oven repaired last week.","Nos arreglaron el horno la semana pasada."]],
 err:[["I cut my hair yesterday. (en la peluquería)","I had my hair cut yesterday.","Si lo hace otro, causativa."],["I had repaired my car.","I had my car repaired.","Objeto antes del participio."]],
 q:[["I'm going to ___ my hair cut tomorrow.",["have","get"]],["We had the oven ___ last week. (repair)",["repaired"]],["It ___ that the recipe is 100 years old. (say)",["is said"]],["He is believed ___ the best baker in town. (be)",["to be"]],{q:"Le hicieron una foto profesional.",o:["She had her photo taken by a professional.","She took her photo taken by a professional.","She had taken her photo by a professional."],a:0}]}
];

export const CHEAT = [
 ["Present simple","verbo / verbo+s","She works here.","Rutinas, verdades","always, every day","u5"],
 ["Present continuous","am/is/are + -ing","She's working now.","Ahora, temporal, planes","now, this week","u7"],
 ["Past simple","verbo-ed / irregular","She worked yesterday.","Pasado terminado","yesterday, ago, last","u9"],
 ["Past continuous","was/were + -ing","She was working at 8.","En progreso en el pasado","while, when, at 8","u14"],
 ["Present perfect","have/has + participio","She has worked here for years.","Experiencia, resultado, hasta hoy","ever, never, just, yet, for, since","u15"],
 ["Present perfect continuous","have/has been + -ing","She's been working all day.","Duración hasta ahora","how long, all day, for, since","u22"],
 ["Past perfect","had + participio","She had left when I arrived.","Antes de otro pasado","already, by the time","u23"],
 ["Past perfect continuous","had been + -ing","She had been working for hours.","Duración antes de otro pasado","for, since, when","u23"],
 ["Future: will","will + verbo","I'll help you.","Decisión al momento, promesa, opinión","I think, probably","u12"],
 ["Future: going to","am/is/are going to + verbo","I'm going to study.","Plan decidido, evidencia","Look!, next year","u12"],
 ["Future continuous","will be + -ing","I'll be working at 9.","En progreso en el futuro","this time tomorrow","u29"],
 ["Future perfect","will have + participio","I'll have finished by 5.","Terminado antes de un momento futuro","by, by the time","u29"]
];

// Chuleta: el mismo verbo en todos los tiempos [inglés, español].
export const SAME_VERB = [["I bake bread every day.","Horneo pan cada día."],["I'm baking bread right now.","Estoy horneando pan ahora."],["I baked bread yesterday.","Ayer horneé pan."],["I was baking when you called.","Estaba horneando cuando llamaste."],["I've baked 200 loaves today.","Hoy he horneado 200 barras."],["I've been baking since 4 a.m.","Llevo horneando desde las 4."],["I had baked everything before we opened.","Lo había horneado todo antes de abrir."],["I'll bake a cake for you.","Te haré un pastel."],["I'm going to bake more on Saturday.","El sábado voy a hornear más."],["This time tomorrow I'll be baking.","Mañana a esta hora estaré horneando."],["By 8 I'll have baked everything.","A las 8 lo habré horneado todo."]];

// Verbos irregulares más usados [infinitivo, pasado, participio, significado].
export const IRREGULARS = [["be","was / were","been","ser, estar"],["have","had","had","tener"],["do","did","done","hacer"],["go","went","gone","ir"],["make","made","made","hacer, fabricar"],["get","got","got","conseguir, llegar"],["say","said","said","decir"],["see","saw","seen","ver"],["know","knew","known","saber, conocer"],["take","took","taken","tomar, llevar"],["come","came","come","venir"],["think","thought","thought","pensar"],["give","gave","given","dar"],["find","found","found","encontrar"],["tell","told","told","contar, decir"],["buy","bought","bought","comprar"],["sell","sold","sold","vender"],["pay","paid","paid","pagar"],["eat","ate","eaten","comer"],["write","wrote","written","escribir"],["speak","spoke","spoken","hablar"],["leave","left","left","irse, dejar"],["begin","began","begun","empezar"],["bring","brought","brought","traer"],["build","built","built","construir"],["feel","felt","felt","sentir"],["keep","kept","kept","guardar, mantener"],["lose","lost","lost","perder"],["put","put","put","poner"],["send","sent","sent","enviar"]];
