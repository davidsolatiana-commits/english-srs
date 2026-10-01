// Temas de la Oxford 3000 (clasificación hecha a mano). Cada palabra va a un solo tema: el primero
// en el que aparece. Las que no salen en ninguna lista van a un tema general según su categoría
// (FALLBACK). El orden de TOPICS es también el orden de aprendizaje dentro de cada nivel: primero
// lo concreto (cosas que se pueden ver o imaginar) y después lo abstracto.
//
// Se usan para crear subgrupos y para ordenar las palabras nuevas por nivel → tema.

export const TOPICS = [
  {
    name: 'Familia y relaciones',
    emoji: '👨‍👩‍👧',
    words:
      'aunt|baby|boy|boyfriend|brother|child|cousin|dad|daughter|family|father|friend|girl|girlfriend|grandfather|grandmother|grandparent|husband|man|mother|mum|parent|partner|people|person|sister|son|teenager|uncle|wife|woman|adult|married|neighbour|couple|divorced|kid|lady|guy|twin|marry|wedding|relationship|birth|male|female|single|guest|member|bride|childhood|engaged|gentleman|marriage|relative|relation|friendship|generation|aged|elderly|household|fellow|youth|teenage|stranger|sex|sexual|born|age|young|old|name|pregnant',
  },
  {
    name: 'Cuerpo y apariencia',
    emoji: '🧍',
    words:
      'arm|body|ear|eye|face|foot|hair|hand|head|leg|mouth|nose|tooth|ankle|blood|bone|brain|finger|heart|knee|neck|shoulder|skin|stomach|curly|blonde|chest|lip|muscle|throat|toe|tongue|nail|breast|heel|lung|organ|nerve|tall|fat|thin|pretty|beautiful|ugly|pale|beauty|appearance|attractive|height|weight|weigh|hearing|smell|sight|look|sense',
  },
  {
    name: 'Salud y medicina',
    emoji: '🏥',
    words:
      'doctor|health|healthy|hospital|nurse|sick|die|accident|alive|dead|death|dentist|disease|flu|headache|hurt|ill|illness|injury|medical|medicine|pain|patient|virus|cigarette|smoke|smoking|drug|alcohol|alcoholic|breath|breathe|breathing|emergency|injure|injured|mental|painful|poison|poisonous|symptom|treat|treatment|drunk|surgery|therapy|cancer|cure|infection|bacteria|vitamin|unconscious|recover|wound|blind|bleed|sleep|tired|rest|fit|fitness|weak|strength|physical|psychologist|psychology|stress',
  },
  {
    name: 'Comida, bebida y cocina',
    emoji: '🍎',
    words:
      'apple|banana|beer|bread|breakfast|butter|cake|carrot|cheese|chicken|chocolate|coffee|cream|delicious|dinner|drink|eat|egg|food|fruit|hungry|ice cream|juice|lunch|meal|meat|milk|onion|orange|pepper|potato|rice|salad|salt|sandwich|soup|sugar|tea|thirsty|tomato|vegetable|water|wine|menu|restaurant|cafe|diet|bean|beef|biscuit|chip|jam|lemon|nut|sauce|sweet|taste|recipe|fresh|flour|grain|ingredient|spicy|slice|mix|mixture|raw|dish|cook|cooking|cup|glass|bottle|bowl|plate|fork|knife|spoon|boil|cooker|fridge|oven|bake|fry|pan|pot|pour|tin|chef|waiter|feed|kitchen|sweet|dessert|snack|hunger',
  },
  {
    name: 'Ropa y moda',
    emoji: '👕',
    words:
      'bag|boot|clothes|coat|dress|hat|jacket|jeans|shirt|shoe|skirt|sweater|trousers|T-shirt|wear|belt|clothing|fashion|jewellery|pants|pocket|sock|suit|tie|uniform|umbrella|cap|costume|dressed|fashionable|glove|underwear|button|style|designer|model|fold',
  },
  {
    name: 'Casa y hogar',
    emoji: '🏠',
    words:
      'apartment|bath|bathroom|bed|bedroom|chair|door|downstairs|floor|flat|garden|home|house|room|shower|table|toilet|upstairs|wall|window|wash|clean|dirty|key|clock|bin|carpet|cupboard|furniture|lamp|mirror|roof|sheet|soap|stair|towel|tidy|lock|gate|hall|washing|lift|ceiling|cottage|curtain|garage|heating|rent|yard|fence|shelf|dust|mess|decorate|decoration|housing|domestic|neat|desk|light|live|living|stay|owner|property|estate|resident|move',
  },
  {
    name: 'Ciudad y lugares',
    emoji: '🏙️',
    words:
      'address|bank|building|capital|centre|cinema|city|country|library|market|museum|park|place|road|shop|street|supermarket|town|village|world|area|local|bridge|castle|community|corner|factory|gallery|palace|pub|region|square|tower|underground|mall|neighbourhood|port|statue|entrance|location|locate|located|county|district|urban|rural|venue|facility|site|store|zone|tunnel|build|construction|construct|crowd|crowded|queue|public|traffic|international|foreign|national|continent|border|regional',
  },
  {
    name: 'Viajes y transporte',
    emoji: '✈️',
    words:
      'airport|bicycle|bike|boat|bus|car|drive|driver|driving|flight|fly|flying|holiday|hotel|journey|passport|plane|station|taxi|ticket|tourist|train|travel|trip|vacation|visit|visitor|map|abroad|airline|cycle|engine|lorry|motorcycle|parking|passenger|petrol|pilot|railway|route|ship|sail|sailing|tour|tourism|traveller|transport|truck|van|vehicle|wheel|arrival|departure|destination|expedition|helicopter|tyre|accommodation|reservation|sailor|aircraft|crash|motor|crew|arrive|leave|luggage|platform|explore|exploration|adventure|guide|speed|fuel|track|road|delay|cancel',
  },
  {
    name: 'Naturaleza y medio ambiente',
    emoji: '🌳',
    words:
      'air|beach|flower|island|mountain|plant|river|sea|sun|tree|climate|coast|desert|earth|environment|field|forest|grass|hill|lake|moon|nature|natural|ocean|planet|pollution|recycle|rock|stone|valley|wild|wood|wave|countryside|earthquake|environmental|flood|leaf|mud|sand|seed|soil|branch|dirt|landscape|wildlife|solar|tropical|bush|root|crop|stream|slope|shade|shadow|sky|fire|flame|grow|growth|waste|rubbish|gas|oil|coal|energy|power|star|space|universe|world|surface',
  },
  {
    name: 'Tiempo atmosférico y estaciones',
    emoji: '🌦️',
    words:
      'autumn|cold|hot|rain|snow|spring|summer|warm|weather|winter|season|cloud|dry|wet|storm|wind|temperature|heat|freeze|frozen|hurricane|mild|cool|ice|degree|melt|bright|dark|sunny',
  },
  {
    name: 'Animales y granja',
    emoji: '🐾',
    words:
      'animal|bird|cat|cow|dog|elephant|fish|horse|lion|mouse|pig|sheep|snake|bear|frog|insect|monkey|pet|spider|bee|tail|wing|feather|creature|species|hunt|hunting|farm|farmer|farming|fur|shell|nest|egg',
  },
  {
    name: 'Deportes y ejercicio',
    emoji: '⚽',
    words:
      'ball|football|gym|player|sport|swim|swimming|team|tennis|win|run|exercise|match|climb|ride|athlete|baseball|basketball|coach|compete|competition|competitor|competitive|fan|golf|goal|hockey|race|runner|running|score|ski|skiing|soccer|trainer|training|winner|champion|rugby|stadium|racing|kick|league|contest|opponent|defeat|victory|pitch|jump|throw|catch|beat|lose|fishing|bike|cycle',
  },
  {
    name: 'Arte, música y literatura',
    emoji: '🎨',
    words:
      'art|artist|band|concert|dance|dancer|dancing|draw|drawing|guitar|music|paint|painting|piano|picture|singer|song|sing|singing|theatre|actor|actress|classical|comedy|drama|instrument|jazz|musical|musician|painter|perform|pop|stage|audience|character|poster|album|drum|folk|performance|poem|poet|poetry|portrait|sculpture|studio|talent|talented|artistic|genre|rhythm|tune|classic|book|story|writer|author|novel|fiction|literature|reader|reading|chapter|plot|narrative|tale|script|title|horror|mystery|culture|cultural|creative|creation|design|illustrate|illustration|image|beauty',
  },
  {
    name: 'Medios, cine y TV',
    emoji: '🎬',
    words:
      'CD|DVD|film|movie|newspaper|magazine|news|radio|television|TV|video|programme|photo|photograph|camera|advertise|advertisement|advertising|ad|cartoon|celebrity|journalist|media|reporter|series|scene|channel|documentary|episode|headline|photographer|photography|viewer|press|broadcast|edition|publication|publish|edit|editor|journal|article|report|interview|show|watch|famous|star|record|recording|entertainment|entertain|listener|speaker',
  },
  {
    name: 'Tecnología e internet',
    emoji: '💻',
    words:
      'blog|computer|email|internet|online|phone|telephone|website|app|button|data|device|digital|download|electric|electrical|electricity|electronic|laptop|link|mobile|network|print|printer|program|screen|smartphone|tablet|technology|user|web|machine|click|keyboard|robot|software|update|scan|battery|file|cable|wire|virtual|install|artificial|satellite|disc|monitor|technical|code|profile|message|text|post|online|search|password|access',
  },
  {
    name: 'Ciencia',
    emoji: '🔬',
    words:
      'science|scientist|biology|chemistry|experiment|lab|physics|research|researcher|metal|chemical|laboratory|nuclear|scientific|substance|theory|liquid|solid|cell|mineral|phenomenon|observe|observation|discover|discovery|invent|invention|test|analyse|analysis|evidence|prove|proof|sample|method|technique|data|measure|measurement|calculate|statistic|diagram|chart|graph|geography|history|mathematics|maths|element|formula|evolution',
  },
  {
    name: 'Educación y estudios',
    emoji: '🎓',
    words:
      'class|classroom|college|course|dictionary|exam|homework|learn|lesson|school|student|study|teach|teacher|university|degree|education|essay|lecture|professor|instruction|instructor|knowledge|learning|teaching|academic|assignment|campus|educate|educated|educational|grade|graduate|qualification|qualified|qualify|revise|pupil|examination|institute|discipline|session|junior|senior|subject|skill|practice|practise|mistake|correct|example|exercise|paragraph|sentence|spell|spelling|translate|translation|word|page|note|pen|pencil|paper|list|topic|section|summary|summarize|definition|define|quiz|primary|secondary|fail|pass|mark|improve',
  },
  {
    name: 'Trabajo y profesiones',
    emoji: '💼',
    words:
      'job|work|worker|working|office|career|police|policeman|architect|assistant|boss|businessman|colleague|detective|director|employ|employee|employer|engineer|engineering|lawyer|manager|officer|professional|salary|secretary|agent|captain|client|employment|profession|retire|retired|staff|unemployed|unemployment|volunteer|meeting|labour|wage|pension|executive|chairman|specialist|task|duty|project|team|manage|management|leader|leadership|deadline|schedule|appointment|application|apply|hire|interview|conference|organize|organizer|organization|skill|experience|experienced|tool|repair|fix|serve|servant|guard|security|uniform|duty',
  },
  {
    name: 'Dinero y compras',
    emoji: '💰',
    words:
      'buy|cheap|cost|dollar|euro|expensive|money|pay|price|pound|sell|shopping|cent|bill|card|rich|poor|cash|credit|earn|sale|penny|afford|account|currency|discount|payment|receipt|spending|luxury|budget|debt|fee|loan|income|purchase|expense|saving|wealth|wealthy|fund|funding|finance|financial|poverty|invest|investment|spend|save|lend|borrow|owe|tax|value|valuable|worth|order|customer|goods|gift|tip|bank',
  },
  {
    name: 'Empresa y economía',
    emoji: '🏢',
    words:
      'business|company|market|product|industry|industrial|service|brand|commercial|consumer|consume|economy|economic|export|import|marketing|profit|trade|production|producer|produce|corporate|firm|sector|contract|insurance|launch|supply|demand|growth|agency|deal|offer|promote|sponsor|stock|global|worldwide|factory|resource|capacity|efficient',
  },
  {
    name: 'Ley y delito',
    emoji: '⚖️',
    words:
      'crime|criminal|law|prison|steal|thief|kill|killing|arrest|court|guilty|illegal|innocent|judge|legal|murder|prisoner|punish|punishment|victim|violent|violence|cheat|justice|offence|offend|witness|suspect|trial|licence|permit|regulation|rule|evidence|police|gang|investigate|investigation|detective|accuse|blame|deny|admit|crime|security|safety|safe|danger|dangerous|warn|warning|rob|rights|right|fair|unfair|honest|dishonest|lie|truth|fault|escape',
  },
  {
    name: 'Política y sociedad',
    emoji: '🏛️',
    words:
      'government|king|president|queen|society|social|population|state|authority|campaign|candidate|election|elect|immigrant|nation|native|official|policy|political|politician|politics|protest|prince|princess|royal|union|vote|citizen|council|parliament|minister|govern|majority|minority|civil|administration|committee|commission|conservative|revolution|freedom|independent|united|democracy|charity|donate|volunteer|community|public|equal|equally|status|rank|lord|master|slave|chief|leader|represent|representative|support|supporter|oppose|opposition|opposed|debate|declare|policy',
  },
  {
    name: 'Guerra y conflicto',
    emoji: '⚔️',
    words:
      'army|attack|fight|fighting|gun|soldier|war|battle|bomb|enemy|weapon|explode|explosion|shoot|shooting|shot|arms|armed|bullet|military|defence|defend|conflict|threat|threaten|rescue|peace|peaceful|destroy|damage|harm|harmful|attack|force|power|powerful|mission|capture|command|surrender|hero|tank|guard',
  },
  {
    name: 'Comunicación y lenguaje',
    emoji: '🗣️',
    words:
      'answer|ask|call|conversation|dialogue|discuss|discussion|explain|explanation|language|letter|phrase|question|repeat|say|speak|talk|tell|meaning|mean|argue|argument|chat|comment|communicate|communication|express|expression|joke|mention|pronounce|reply|request|respond|response|shout|speech|voice|announce|announcement|apologize|clause|quote|quotation|spoken|written|persuade|convince|whisper|remark|scream|swear|cite|interpret|interrupt|describe|description|introduce|introduction|greet|hello|hi|bye|goodbye|thank|thanks|please|sorry|welcome|yes|no|OK|yeah|hey|oh|ah|wow|sir|dear|promise|suggest|suggestion|advise|advice|recommend|recommendation|invite|invitation|inform|information|contact|reference|refer|listen|hear|read|write|writing|noise|noisy|loud|loudly|quiet|quietly|silence|silent|sound|tone|signal|sign|symbol|label|feedback|review|criticize|criticism|critic|praise|complain|complaint|agree|disagree|agreement|confirm|claim|insist|state|statement|note|native|accent',
  },
  {
    name: 'Emociones y sentimientos',
    emoji: '😊',
    words:
      'angry|bored|boring|excited|exciting|happy|love|sad|hate|afraid|interested|interesting|tired|fear|nervous|pleased|scared|scary|surprised|surprise|surprising|unhappy|worry|worried|cry|laugh|laughter|smile|feel|feeling|amazed|amazing|annoy|annoyed|annoying|calm|cheerful|disappointed|disappointing|embarrassed|embarrassing|emotion|excitement|frighten|frightened|frightening|glad|grateful|happiness|happily|lonely|mood|proud|relaxed|relaxing|upset|anger|anxious|ashamed|delight|delighted|depressed|depressing|desperate|emotional|joy|shame|shock|shocked|satisfied|satisfy|sympathy|relief|regret|nightmare|like|enjoy|hope|wish|miss|care|kiss|hug|pleasure|pleasant|unpleasant|fun|funny|sadly|terrible|awful|horrible|wonderful|fantastic|lovely|bother|comfort|comfortable|uncomfortable|impress|impressed|impressive|impression|admire|appreciate|desire|passion|confidence|confident|courage|trust|doubt|suffer|stress|patience',
  },
  {
    name: 'Personalidad y carácter',
    emoji: '🧠',
    words:
      'friendly|nice|kind|careful|careless|clever|crazy|intelligent|intelligence|lazy|polite|rude|stupid|personality|ambitious|ambition|brave|cruel|generous|gentle|keen|sensible|shy|silly|aggressive|decent|sincere|wise|tough|enthusiastic|enthusiasm|humorous|humour|sensitive|impatient|flexible|honest|calm|serious|strict|loyal|mad|smart|talent|character|behave|behaviour|manner|habit|attitude|helpful|independent|confident|patient|reliable|responsible|responsibility|mature|odd|strange|weird|normal|ordinary|typical|unusual|special|cool|quiet|ability',
  },
  {
    name: 'Mente y pensamiento',
    emoji: '💭',
    words:
      'believe|decide|decision|forget|guess|idea|imagine|imagination|imaginary|know|opinion|prefer|remember|think|thinking|thought|understand|understanding|want|consider|consideration|dream|expect|expectation|expected|memory|mind|realize|recognize|suppose|wonder|belief|intend|intention|intended|aware|assume|concept|notion|insight|conscious|perspective|philosophy|logical|judgement|recall|regard|reason|plan|planning|choose|choice|option|alternative|prefer|focus|concentrate|concentration|attention|notice|ignore|learn|solve|solution|problem|question|answer|clue|puzzle|mystery|secret|truth|true|false|sure|certain|certainly|probably|possible|possibility|impossible|likely|unlikely|predict|prediction|guess|estimate|judge|evaluate|assess|assessment|compare|comparison|contrast|difference|similar|similarity|same|different|opinion|view|point|aim|purpose|goal|objective|target|motivation|inspire|curious|wonder|theory|hesitate|convinced',
  },
  {
    name: 'Ocio, fiestas y celebraciones',
    emoji: '🎉',
    words:
      'birthday|festival|game|hobby|party|relax|toy|celebrate|celebration|gift|invitation|prize|camp|camping|ceremony|leisure|exhibition|outdoor|outdoors|indoor|indoors|anniversary|event|club|fun|play|holiday|free|weekend|ticket|visit|zoo|picnic|magic|trick|luck|lucky|fortune|bet|card|dice|puzzle|chess|activity|entertain|entertainment|attraction|attract|tour|party',
  },
  {
    name: 'Religión y creencias',
    emoji: '🙏',
    words:
      'god|church|pray|prayer|priest|religion|religious|spirit|spiritual|ghost|heaven|hell|holy|soul|faith|moral|evil|ethical|tradition|traditional|custom|culture|ceremony|bless|sacred|angel|devil|miracle|fate',
  },
  {
    name: 'Tiempo y calendario',
    emoji: '⏰',
    words:
      'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|afternoon|ago|always|century|date|day|early|evening|hour|late|later|midnight|minute|moment|month|morning|night|now|o\'clock|often|once|sometimes|soon|then|time|today|tomorrow|tonight|twice|usually|week|year|yesterday|never|ever|still|already|yet|since|until|during|before|after|past|future|daily|recently|recent|schedule|immediately|immediate|suddenly|sudden|finally|firstly|secondly|while|decade|eventually|frequently|frequency|meanwhile|previously|previous|rarely|regularly|regular|currently|current|latest|forever|till|afterwards|annual|temporary|permanent|initially|initial|occasionally|occasion|long-term|pace|sequence|age|period|calendar|clock|watch|birthday|history|historic|historical|ancient|modern|contemporary|old-fashioned|new|next|last|first|final|begin|beginning|start|end|ending|finish|stop|continue|continuous|delay|wait|quick|quickly|fast|slow|slowly|rapid|rapidly|gradually|instant|lately|nowadays|someday|whenever|again',
  },
  {
    name: 'Números y cantidades',
    emoji: '🔢',
    words:
      'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|zero|second|third|fourth|fifth|double|half|quarter|amount|quantity|per cent|percentage|count|number|metre|kilometre|mile|inch|plenty|total|statistic|dozen|maximum|minimum|multiply|divide|sum|numerous|multiple|scale|volume|extra|enough|several|whole|single|pair|couple|lot|bit|piece|part|average|rate|level|range|limit|limited|increase|decrease|reduce|reduction|add|addition|additional|calculate|measure|weigh|weight|length|size|percent|extent',
  },
  {
    name: 'Colores, formas y tamaños',
    emoji: '🔷',
    words:
      'black|blue|brown|colour|coloured|green|grey|pink|purple|red|white|yellow|gold|silver|big|small|little|large|long|short|high|low|huge|enormous|tiny|wide|narrow|deep|depth|thick|thin|heavy|light|circle|shape|square|round|curve|curved|angle|line|point|pointed|straight|flat|vast|massive|broad|hollow|bright|pale|dark|edge|corner|middle|centre|top|bottom|side|surface|smooth|rough|sharp|soft|hard|tight|loose|bent|full|empty',
  },
  {
    name: 'Materiales y objetos',
    emoji: '🧱',
    words:
      'box|paper|plastic|wood|wooden|metal|glass|tool|rope|chain|coin|cotton|iron|leather|wool|pin|pipe|needle|tape|string|tube|package|rubber|steel|wire|silk|thing|object|item|stuff|material|bag|bottle|container|content|frame|board|sheet|card|cloth|stone|brick|bell|flag|toy|gift|key|lock|lamp|mirror|ring|candle|stamp|tin|jar|basket|bucket|ladder|net|tent|seat|shelf|handle|switch|wheel|pocket|instrument|equipment|device|alarm|battery',
  },
  {
    name: 'Lugar, dirección y movimiento',
    emoji: '🧭',
    words:
      'above|across|around|away|back|behind|below|between|down|east|far|front|here|in|inside|left|near|next to|north|opposite|out|outside|over|right|south|there|through|under|up|west|come|go|move|movement|return|walk|fall|along|among|anywhere|everywhere|nowhere|somewhere|direction|distance|forward|towards|onto|ahead|apart|backwards|eastern|northern|southern|western|within|throughout|beyond|downwards|upwards|elsewhere|outer|inner|upper|lower|external|internal|via|wherever|surround|surrounding|enter|exit|cross|follow|lead|reach|approach|pass|position|place|spot|location|path|way|step|stand|sit|lie|hide|appear|disappear|rise|raise|drop|land|float|sink|slide|slip|flow|spread|turn|roll|push|pull|carry|bring|take|send|deliver|delivery|transfer|remove|replace|arrange|separate|join|connect|connection|link|attach|stick|hang|lay|put|set|place|platform|side',
  },
  {
    name: 'Acciones físicas',
    emoji: '✋',
    words:
      'catch|cover|cut|drop|hit|hold|jump|knock|pack|pick|press|shake|shut|throw|touch|bend|fold|hang|roll|bite|blow|break|broken|burn|climb|close|open|dig|drag|grab|kick|lean|lift|melt|mount|pour|rub|split|squeeze|stretch|sweep|swing|tear|tie|wrap|pile|fill|empty|clean|wash|brush|paint|draw|build|fix|repair|cook|kiss|wave|point|shoot|throw|fly|swim|ride|drive|walk|run|jump|dance|climb|hurry|rush|chase|escape|kneel|crawl|stare|look|see|watch|hear|smell|taste|touch|feel',
  },
  {
    name: 'Verbos de uso diario',
    emoji: '🔄',
    words:
      'be|have|do|get|give|go|make|take|come|see|know|use|find|need|keep|let|try|help|show|start|stop|change|check|choose|finish|lose|meet|miss|need|send|share|wait|wake|want|work|buy|bring|call|carry|happen|include|included|including|contain|become|seem|look|sound|feel|belong|depend|exist|matter|mean|stay|leave|live|die|grow|learn|win|lose|pay|spend|own|possess|provide|offer|accept|refuse|reject|allow|let|prevent|avoid|manage|handle|deal|succeed|attempt|try|achieve|achievement|complete|continue|create|develop|develop|improve|increase|reduce|cause|affect|effect|involve|involved|require|requirement|obtain|gain|receive|collect|gather|save|protect|support|test|prove|check|compare|match|suit|fit|prepare|prepared|plan|organize|arrange|book|order|return|repeat|replace|remain|rely|depend|tend|seem',
  },
  {
    name: 'Cambios y resultados',
    emoji: '📈',
    words:
      'result|success|successful|progress|process|development|improvement|advance|advanced|outcome|consequence|impact|influence|trend|shift|transition|alter|modify|vary|convert|adapt|adopt|expand|extend|enhance|decline|collapse|emerge|arise|occur|generate|establish|found|transform|failure|reaction|react|effort|achievement|award|reward|loss|maintain|preserve|retain|survive|struggle|strike|settle|resolve|reveal|expose|display|demonstrate|highlight|indicate|emphasis|emphasize|release|abandon|conclude|conclusion|determine|identify|examine|reflect|contribute|contribution|participate|participant|attend|act|operate|operation|conduct|pursue|seek|acquire|submit|propose|proposal|pose|imply|detect|dominate|engage|encounter|accompany|acknowledge|confuse|relate|quit|pretend|fancy|dislike|shine|bury|fasten',
  },
  {
    name: 'Orden, tipos y sistemas',
    emoji: '🗂️',
    words:
      'system|structure|group|unit|category|type|sort|form|pattern|function|procedure|scheme|strategy|component|core|principle|standard|criterion|arrangement|division|distribution|distribute|selection|select|version|theme|department|institution|association|associate|associated|panel|layer|row|column|block|base|basis|based|mass|load|means|origin|original|variety|various|collection|combination|combine|consist|feature|characteristic|aspect|detail|detailed|factor|instance|case|copy|draft|outline|document|diary|mail|register|entry|enquiry|reception|context|background|setting|situation|circumstance|condition|fact|reality|realistic|existence|being|self|identity|role|individual|routine|lifestyle|life|interest|action|opening|passage|phase|bar|pool|figure|ground|hole|bubble|powder|diamond|printing|flash|bunch|cast|bond|affair|agenda|host|exchange|charge|balance|atmosphere|presentation|preparation|presence|initiative|vision|self|expert|architecture|mass',
  },
  {
    name: 'Problemas y oportunidades',
    emoji: '⚠️',
    words:
      'trouble|disaster|crisis|risk|error|difficulty|challenge|issue|concern|concerned|barrier|gap|lack|weakness|pressure|incident|excuse|advantage|disadvantage|benefit|opportunity|chance|priority|prospect|obligation|commitment|commit|appeal|aid|assist|permission|approval|approve|ban|protection|privacy|shelter|reserve|resort|favour|respect|honour|reputation|popularity|popular|guarantee|grant|deserve|justify|forgive|obey|resist|urge|beg|encourage|remind|ensure|secure|enable|impose|dismiss|importance|quality|possession|survey|source|term|control|progress|finding|crisis|rid',
  },
  {
    name: 'Valorar y describir',
    emoji: '✅',
    words:
      'bad|best|better|worse|worst|good|great|fine|perfect|excellent|brilliant|incredible|extraordinary|important|main|major|minor|necessary|unnecessary|essential|vital|crucial|significant|relevant|fundamental|prime|useful|easy|difficult|simple|complex|complicated|confusing|confused|basic|ideal|suitable|appropriate|acceptable|reasonable|proper|convenient|practical|effective|positive|negative|common|rare|usual|unique|unknown|unexpected|familiar|obvious|apparent|clear|definite|absolute|actual|accurate|exact|specific|particular|general|formal|informal|personal|private|human|real|present|ready|available|busy|active|alone|asleep|lost|missing|closed|connected|fixed|covered|direct|indirect|central|remote|entire|extreme|intense|severe|slight|steady|stable|constant|consistent|potential|critical|dramatic|romantic|mysterious|lively|bitter|plain|pure|grand|giant|medium|mixed|matching|folding|shiny|sticky|steep|stiff|shallow|blank|repeated|used|former|following|further|everyday|favourite|strong|wrong|able|unable|capable|willing|determined|organized|deliberate|offensive|fascinating|leading|visual|related|brief',
  },
  {
    name: 'Palabras gramaticales',
    emoji: '🧩',
    words:
      'a, an|and|any|anyone|anything|as|at|because|both|but|by|can|cannot|could|each|either|every|everybody|everyone|everything|few|for|from|have to|he|her|him|his|I|if|it|its|me|more|most|much|must|my|no one|nobody|not|nothing|of|on|or|other|our|she|should|so|some|somebody|someone|something|than|that|the|their|them|they|this|to|us|we|what|when|where|which|who|why|will|with|without|would|you|your|yourself|another|all|also|many|own|same|such|too|very|how|anybody|hers|herself|himself|itself|mine|myself|neither|none|ourselves|shall|themselves|whose|yours|might|per|nor|ours|theirs|ought|whatever|whenever|whether|unless|upon|whom|whereas|thus|used to|may|less|least|little|off|into|about|like|than|till|onto|whoever|whichever|else|any more|all right|until|despite|though|although|unlike|except|instead|against|according to|due|plus|via',
  },
  {
    name: 'Conectores y adverbios',
    emoji: '🔗',
    words:
      'actually|anyway|especially|however|maybe|perhaps|probably|really|quite|rather|just|only|even|again|almost|still|unfortunately|fortunately|certainly|definitely|exactly|extremely|mostly|nearly|normally|therefore|indeed|nevertheless|furthermore|otherwise|overall|basically|apparently|obviously|absolutely|clearly|completely|surely|simply|totally|generally|mainly|particularly|specifically|largely|partly|relatively|slightly|somewhat|hardly|fairly|highly|truly|ultimately|well|so|also|too|either|besides|moreover|hence|consequently|meanwhile|firstly|secondly|finally|lastly|eventually|thus|whereas|unlike|similarly|equally|directly|indirectly|naturally|originally|personally|properly|perfectly|seriously|easily|badly|differently|correctly|carefully|deeply|closely|widely|commonly|constantly|increasingly|deliberately|effectively|entirely|fully|heavily|incredibly|necessarily|previously|rapidly|significantly|strongly|successfully|typically|approximately|exact|indeed|anyhow|otherwise|nearly|sure|of course|ever|yet',
  },
];

// Para las que no están en ninguna lista: según su categoría.
export const FALLBACK = {
  verbo: { name: 'Otros verbos', emoji: '🏃' },
  sustantivo: { name: 'Ideas y conceptos', emoji: '💡' },
  adjetivo: { name: 'Cualidades y descripciones', emoji: '✨' },
  adverbio: { name: 'Conectores y adverbios', emoji: '🔗' },
  otro: { name: 'Palabras gramaticales', emoji: '🧩' },
};

// { "palabra en minúscula": índice del tema } (el primer tema en el que aparece).
let index;
export function topicIndex() {
  if (index) return index;
  index = new Map();
  TOPICS.forEach((t, i) => {
    for (const w of t.words.split('|')) {
      const k = w.trim().toLowerCase();
      if (k && !index.has(k)) index.set(k, i);
    }
  });
  return index;
}

// Nombre y emoji del tema de una palabra.
export function topicOf(word) {
  const i = topicIndex().get(word.word_en.trim().toLowerCase());
  if (i !== undefined) return TOPICS[i];
  return FALLBACK[word.category] ?? FALLBACK.otro;
}

const LEVEL_RANK = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };

// Crea (o reutiliza) un subgrupo por tema dentro del grupo y mete en él sus palabras. Con
// reorder, las palabras nuevas pasan a llegar por nivel → tema (las del mismo tema, seguidas).
export async function organizeByTopics(db, groupId, { reorder = true } = {}) {
  const words = db.wordsByIds(db.groupWordIds(groupId));
  const buckets = new Map();
  for (const w of words) {
    const t = topicOf(w);
    if (!buckets.has(t.name)) buckets.set(t.name, { topic: t, ids: [] });
    buckets.get(t.name).ids.push(w.id);
  }
  return db.batch(async () => {
    const existing = new Map(
      db.listGroups().filter((g) => g.parent_id === groupId).map((g) => [g.name, g.id]),
    );
    let created = 0;
    for (const name of TOPIC_ORDER) {
      const b = buckets.get(name);
      if (!b) continue;
      let id = existing.get(name);
      if (!id) {
        id = await db.createGroup(name, groupId, b.topic.emoji);
        created++;
      }
      await db.addToGroup(b.ids, id);
    }
    if (reorder) {
      const rank = (w) => [LEVEL_RANK[w.cefr_level] ?? 9, TOPIC_ORDER.indexOf(topicOf(w).name), w.import_order ?? 0];
      const sorted = words
        .filter((w) => w.import_order != null)
        .sort((a, b) => {
          const ra = rank(a);
          const rb = rank(b);
          return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2];
        });
      await db.reorderImported(sorted.map((w) => w.id));
    }
    return { topics: buckets.size, created, words: words.length };
  });
}

// Orden de aprendizaje de los temas: los de TOPICS en su orden; los generales, al final.
export const TOPIC_ORDER = [
  ...TOPICS.map((t) => t.name),
  ...[...new Set(Object.values(FALLBACK).map((t) => t.name))].filter((n) => !TOPICS.some((t) => t.name === n)),
];
