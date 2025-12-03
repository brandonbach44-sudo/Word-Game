import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const VALID_WORDS = new Set([
'aback','abacus','abased','abaser','abases','abated','abater','abates','abbess','abbeys','abbot','abbots','abduce','abduct','abeles','abhor','abhors','abide','abided','abider',
'abides','abject','abjure','ablate','ablaze','able','abler','ablest','abloom','ablush','aboard','aboded','abodes','aboral','abound','aboves','abrade','abroad','abrupt','abseil',
'absent','absorb','absurd','abulia','abuse','abused','abuser','abuses','abvolt','abwatt','abying','abyss','acacia','accede','accent','accept','access','accord','accost','accrue',
'accuse','ace','acetic','acetyl','ache','achene','achier','aching','acid','acidic','acidly','acids','acinus','ackees','acme','acne','acorn','acorns','acquit','acre',
'acres','across','act','acted','acting','action','active','actor','actors','actual','acuity','acumen','acute','acuter','adage','adages','adapt','adapts','add','added',
'addend','adder','adders','addict','adding','addled','addles','adduce','adduct','adenyl','adept','adepts','adhere','adjoin','adjust','admire','admit','admits','ado','adobe',
'adobes','adonis','adopt','adored','adorer','adores','adorns','adrift','adroit','ads','adult','adults','advent','adverb','advert','advice','advise','aegis','aeons','aerial',
'aerie','aerier','aeries','aerobe','affair','affect','affirm','affix','afford','affray','afghan','afield','afire','aflame','afloat','afoot','afoul','afraid','afresh','aft',
'after','again','agape','agate','age','aged','agency','agenda','agent','agents','ages','aggro','agile','aging','ago','agony','agree','agreed','agrees','ahead',
'aid','aide','aider','aides','aiding','aids','ailing','aim','aimed','aimer','aims','air','airbag','aired','airing','airs','airway','airy','aisle','ajar',
'akin','alarm','albino','album','albums','alder','ale','alert','alerts','algae','alibi','alien','align','alike','alive','all','allay','alley','allied','allies',
'allot','allow','allows','alloy','alloys','ally','almond','almost','alms','aloft','alone','along','aloof','aloud','alpha','also','altar','alter','alto','always',
'amass','amaze','amazed','amber','ambit','amble','ambush','amend','amends','amid','amino','amiss','amity','amok','among','amount','amp','ample','amply','amps',
'amuse','amused','anchor','and','angel','angels','anger','angers','angle','angled','angry','angst','anime','ankle','ankles','annex','annoy','annual','anode','answer',
'ant','ante','anti','antic','antics','ants','antsy','anvil','any','anyone','anyway','aorta','apache','apart','apathy','ape','apes','apex','apexes','aphid',
'aping','apnea','appeal','appear','apple','apples','apply','apron','apt','arc','arcade','arch','arched','arches','arcs','arctic','are','area','areas','arena',
'argue','argued','argues','aria','arid','arise','arisen','arises','ark','arks','arm','armed','armful','armies','armor','armpit','arms','army','aroma','arose',
'around','array','arrays','arrest','arrive','arrow','arrows','arson','art','artery','artful','artist','arts','artsy','arty','ascent','ascot','ash','ashen','ashes',
'ashore','ashy','aside','ask','asked','asking','asks','aspect','aspen','aspic','aspire','assert','assess','asset','assets','assign','assist','assume','asthma','asylum',
'ate','atlas','atom','atone','attach','attack','attain','attend','attic','attics','auburn','audio','audit','augers','augur','augury','august','aunt','aunts','aural',
'auras','author','autism','auto','autos','autumn','avail','avant','avatar','avenue','averse','avian','aviary','avid','avocet','avoid','avoids','await','awaits','awake',
'awaken','award','awards','aware','awash','awe','awes','awful','awl','awls','awn','awoke','awry','axe','axed','axes','axial','axiom','axion','axis',
'axles','aye','azalea','azure','baa','babe','babel','babes','baby','back','backs','bacon','bad','bade','badge','badly','bag','bagel','baggy','bags',
'bail','bails','bairn','bait','baits','bake','baked','baker','bakes','bald','bale','baled','baler','bales','balk','balks','balky','ball','balls','balm',
'balms','balmy','balsa','ban','banal','band','bands','bandy','bane','banes','bang','bangs','banjo','bank','banks','bans','bar','barb','barbs','bare',
'bared','barer','bares','barge','bark','barks','barn','barns','baron','bars','basal','base','based','baser','bases','bash','basic','basics','basil','basin',
'basis','bask','basks','bass','baste','bat','batch','bated','bath','bathe','baths','batik','baton','bats','battle','batty','bawdy','bawl','bawls','bay',
'bays','beach','bead','beads','beady','beak','beaker','beaks','beam','beams','beamy','bean','beans','bear','beard','beards','beast','beat','beaten','beater',
'beats','beaus','beaut','beauty','beaux','bebop','became','beck','become','bed','bedded','bedder','bedew','beds','bee','beech','beef','beefs','beefy','been',
'beep','beeps','beer','beers','bees','beet','beetle','beets','befit','before','beg','began','begat','beget','beggar','begged','begin','begins','begun','behalf',
'behave','behind','being','beings','belch','belie','belief','bell','belle','bells','belly','belong','below','belt','belts','ben','bench','bend','bends','bendy',
'bent','bento','bents','berg','bergs','berm','berry','berth','beset','beside','best','bests','bet','betas','betel','betray','bets','better','bevel','bevels',
'bevvy','beyond','bezel','bias','biased','bib','bible','bibs','bicep','bid','biddy','bide','bided','bider','bides','bidet','bidis','bids','big','bigger',
'bike','biked','biker','bikes','bikini','bile','biles','bilge','bill','bills','billy','bimbo','bin','binary','bind','binder','binds','binge','bingo','bins',
'biome','biped','bipod','birch','bird','birds','birth','bit','bite','bites','bits','bitten','bitter','bitty','black','blacks','blade','blades','blah','blame',
'blamed','bland','blank','blanks','blare','blase','blast','blasts','blaze','blazed','blazer','blazes','bleach','bleak','bleat','bled','bleed','bleeds','bleep','blend',
'blends','bless','blew','blimp','blind','bling','blini','blink','blips','bliss','blitz','bloat','blob','blobs','bloc','block','blocs','blog','bloke','blond',
'blonde','blood','bloods','bloody','bloom','blooms','bloop','blot','blouse','blow','blown','blows','blue','blued','bluer','blues','bluff','bluffs','blunt','blur',
'blurb','blurs','blurt','blush','boa','boar','board','boards','boars','boast','boasts','boat','boats','bob','bobby','bobs','bock','bod','bode','boded',
'bodes','bodge','bodies','body','bog','bogie','bogs','bogus','boil','boiled','boiler','boils','bolas','bold','bolder','bolt','bolted','bolts','bomb','bomber',
'bombs','bond','bonded','bonds','bone','boned','boner','bones','bongo','bongs','bonks','bonnet','bonny','bonus','bony','boobs','booby','booed','book','booked',
'books','boom','booms','boomy','boon','boons','boors','boost','boosts','boot','booth','boots','booty','booze','boozy','bop','borax','border','bore','bored',
'borer','bores','born','borne','boron','borrow','bosom','boss','bosses','bossy','bot','botch','both','bottle','bough','bought','bounce','bound','bounds','bout',
'bouts','bow','bowed','bowel','bower','bowl','bowls','bows','box','boxed','boxer','boxers','boxes','boxing','boy','boyar','boys','bra','brack','bract',
'brads','brag','brags','braid','brain','brains','brake','brakes','bran','branch','brand','brands','brandy','bras','brash','brass','brat','brats','brave','braver',
'bravo','brawl','brawn','bray','brays','brazen','breach','bread','breads','break','breaks','bream','breast','breath','bred','breed','breeds','breeze','breezy','brew',
'brewed','brewer','briar','bribe','brick','bricks','bridal','bride','brides','bridge','brief','briefs','brier','bright','brim','brine','bring','brings','brink','brinks',
'briny','brio','brisk','brit','broad','brogue','broil','broke','broken','broker','bronze','brood','broods','brook','brooks','broom','brooms','broth','brow','brown',
'browns','brows','browse','bruin','bruise','brush','brutal','brute','bub','bubble','buck','bucket','buckle','bucks','bud','buddy','budge','budget','buds','buff',
'buffet','bug','bugged','buggy','bugle','bugs','build','builds','built','bulb','bulbs','bulge','bulk','bulks','bulky','bull','bullet','bulls','bully','bum',
'bump','bumps','bumpy','bums','bun','bunch','bundle','bunds','bundy','bung','bunk','bunker','bunks','bunny','buns','bunts','buoy','buoys','bur','burbs',
'burden','bureau','burger','buried','burly','burn','burner','burns','burnt','burp','burps','burr','burro','burrow','burrs','burst','bursts','bury','bus','busby',
'bush','bushed','bushel','bushy','busier','busk','busks','bust','busted','buster','busts','busty','busy','but','butch','butler','butt','butte','butter','button',
'butts','buxom','buy','buyer','buyers','buying','buys','buzz','buzzy','bylaw','bypass','bytes','byway','cab','cabal','cabby','caber','cabin','cable','cables',
'cacao','cache','cached','caches','cachet','cacti','cad','caddy','cadet','cadets','cadre','cafe','cafes','caftan','cage','caged','cager','cages','cagey','cagily',
'caging','cagmag','cairn','cake','caked','cakes','calf','calico','calif','calks','call','called','calls','calm','calmer','calms','calve','cam','came','camel',
'camels','cameo','camera','camp','camped','camps','campy','cams','can','canal','cander','candle','candy','cane','caned','canes','canid','canine','canker','canned',
'cannon','cannot','canny','canoe','canon','canopy','cans','canto','canvas','canyon','cap','cape','caper','capers','capes','capita','capon','capos','caps','car',
'carbon','card','carded','cards','care','cared','careen','career','carer','cares','caress','cargo','caring','carnal','carob','carol','carols','carp','carpet','carps',
'carrot','carry','cars','cart','carts','carve','carved','case','cased','casein','cases','cash','cashed','cashew','casing','casino','cask','casket','casks','cast',
'caste','caster','castle','casts','casual','cat','catch','cater','cats','catty','caught','caulk','cause','caused','causer','causes','cauted','cave','caves','caviar',
'cavil','cavity','caw','cease','ceased','cedar','ceded','cedes','ceding','celery','cellar','cells','cement','census','center','cents','chafe','chaff','chain','chair',
'chairs','chalk','champ','chams','chance','change','chant','chaos','chapel','chaps','chard','charge','charm','charms','chart','charts','chase','chased','chaser','chases',
'chasm','cheap','cheat','cheats','check','checks','cheek','cheeks','cheep','cheer','cheers','cheese','cherry','chess','chest','chests','chewed','chewy','chick','chicks',
'chide','chief','chiefs','child','childs','chile','chili','chill','chills','chilly','chimp','chimps','china','chinas','chink','chips','chirp','chits','chive','choice',
'choir','choirs','choke','chokes','chomp','choose','chord','chore','chorus','chose','chosen','chuck','chuff','chump','chums','chunk','chunks','church','churn','chute',
'chutes','cider','cigar','cigars','cinch','circa','circle','circus','cited','cites','cities','citing','civet','civic','civil','clack','claim','claims','clamp','clamps',
'clams','clang','clank','clanks','clans','claps','claret','clash','clasp','clasps','class','classy','clause','clawed','claws','clays','clean','cleans','clear','clears',
'cleat','cleats','cleft','clergy','clerk','clerks','clever','click','clicks','client','cliff','cliffs','climb','climbs','climes','cline','cling','clings','clink','clinks',
'clips','clique','cloak','cloaks','clock','clocks','clods','clone','clones','close','closed','closer','closes','cloth','clothe','cloths','cloud','clouds','cloudy','clout',
'clove','clown','clowns','clubby','clubs','cluck','clucks','clued','clues','clump','clumps','clumsy','clung','clunk','clutch','coach','coals','coarse','coast','coasts',
'coated','coater','coats','cob','cobalt','cobia','cobra','cobweb','cocked','cocker','cockle','cocks','cocky','cocoa','cocoon','cod','codas','coddle','coded','coder',
'codes','coeds','coerce','coffee','coffer','coffin','cog','cogent','cogged','cohere','coiled','coils','coiner','coins','coked','cokes','colas','colder','coldly','colds',
'collar','collie','colon','color','colors','colour','colts','column','comas','combat','combed','combo','combs','comedy','comely','comer','comes','comet','comets','comfy',
'comic','comics','coming','comma','commas','commit','common','compel','comply','comps','conch','concur','condo','condor','cones','confer','conks','conned','consul','convex',
'convey','cooed','cooked','cooker','cookie','cooks','cooled','cooler','coolly','cools','cooped','coops','coopt','cop','copier','copper','copses','corals','corded','corder',
'cores','corks','corky','corms','corner','cornet','corns','cornu','corny','corps','corpse','corpus','corral','corset','cortex','coset','cosmos','cosset','costly','costs',
'cot','cotton','couch','cougar','cough','coughs','could','coulee','count','counts','county','coupe','couple','coupon','coups','course','court','courts','cousin','coven',
'covens','cover','covers','covet','covey','cow','coward','cowed','cower','cox','coy','coyote','crack','cradle','craft','crafts','crafty','craggy','crags','cramp',
'cramps','crams','crane','craned','cranes','crank','cranks','cranky','cranny','craps','crash','crass','crate','crated','crater','crates','crave','craved','craven','craves',
'crawl','crawls','craws','craze','crazed','crazes','crazy','creak','creaks','cream','creams','creamy','crease','create','credo','creed','creeds','creek','creeks','creep',
'creeps','creepy','creme','crepe','crept','cress','crest','cretin','crewed','crews','crick','cried','crier','cries','crime','crimp','crimps','cringe','crisp','crispy',
'critic','croak','crock','crocks','crony','crook','crooks','croon','crops','cross','crouch','crowds','crowns','cruise','crumbs','crumby','crummy','crunch','crusts','crusty',
'crying','crypto','cub','cubits','cuckoo','cud','cuddle','cudgel','cue','cuffed','culled','cumuli','cup','cupped','cupric','cur','curbed','curdle','curled','curler',
'curtly','curves','curvet','custom','cut','cutoff','cutter','cyborg','cycled','cycles','cypher','dab','dabbed','dabs','dad','daft','dagger','daily','dairy','daisy',
'dale','dales','dam','damage','dame','dames','damn','damned','damp','damper','dams','damsel','dance','dancer','dances','dandy','danger','dangle','danish','dank',
'dapper','dare','dared','darer','darers','dares','dark','darken','darker','darks','darn','darns','dart','darted','darter','darts','dash','dashed','dasher','dashes',
'data','date','dated','dater','dates','dating','datum','daub','daubed','dauber','daubs','daw','dawdle','dawn','dawned','dawns','day','days','daze','deacon',
'dead','deaden','deader','deadly','deaf','deafen','deafer','deafly','deal','dealer','deals','dealt','dean','deans','dear','dearer','dearly','dears','dearth','deary',
'death','deaths','deb','debar','debase','debate','debit','debits','debris','debt','debtor','debts','debug','debugs','debut','decade','decaf','decal','decay','decays',
'deceit','decent','decide','deck','decks','decode','decor','decoy','decoys','decree','decry','deduce','deduct','deed','deeds','deem','deemed','deems','deep','deepen',
'deeper','deeply','deeps','deer','deers','defame','defeat','defect','defend','defer','defile','define','deform','defray','degree','deice','deify','deign','deity','deked',
'delay','delays','delete','delude','deluge','deluxe','delve','demand','demise','demo','demon','demons','demote','demur','demure','den','denied','denies','denim','denims',
'dense','dent','dented','dents','deny','deport','depose','depot','depots','depth','depths','deputy','derail','derby','derive','descry','desert','design','desire','desist',
'desk','desks','detach','detail','detain','detect','deter','detest','detour','detox','deuce','device','devil','devils','devise','devoid','devote','devour','dew','dewar',
'dewier','dewy','dial','dialed','dialer','dialog','diaper','diary','dice','diced','dicer','dices','dicey','dicier','dicing','dicky','dictum','did','diddle','die',
'died','dieing','dies','diesel','diet','dieted','dieter','diets','differ','dig','digest','digit','digits','digs','diked','dikes','dilate','dills','dilly','dim',
'dime','dimer','dimes','dimly','dimmed','dimmer','dimple','dimply','dims','din','dinar','dinars','dine','dined','diner','diners','dines','ding','dinghy','dingo',
'dingos','dings','dingy','dining','dinky','dinned','dinner','dint','dints','diode','dip','diplex','dipped','dipper','dippy','dipso','dire','direct','direr','direst',
'dirge','dirges','dirks','dirt','dirty','disarm','disc','disco','discs','discus','dish','dishes','dishy','disk','disks','dismal','dismay','dispel','disuse','ditch',
'dither','ditto','ditty','divan','divas','dive','dived','diver','divers','divert','dives','divest','divide','divine','diving','divot','divvy','dizzy','djinn','doc',
'docile','dock','docked','docker','docket','docks','docs','doctor','dodder','dodge','dodged','dodger','dodges','dodgy','dodo','dodos','doe','doer','doers','does',
'doesnt','doff','doffs','dog','doge','dogged','dogie','dogma','dogs','doily','doing','dole','doled','doles','doll','dollar','dollop','dolls','dolly','dolman',
'dolor','dolts','domain','dome','domed','domes','domino','don','donate','done','donee','donga','dongs','donkey','donna','donned','donor','donors','donut','doodle',
'doom','doomed','dooms','door','doors','doozy','dope','doped','doper','dopes','dopey','doping','dork','dorks','dorky','dorm','dorms','dorsa','dorsi','dose',
'dosed','doses','dot','dotage','dote','doth','doting','dots','dotted','dotter','dotty','double','doubly','doubt','doubts','dough','doughs','doughy','dour','douse',
'doused','douser','douses','dove','doves','dowdy','dowel','dowels','dower','down','downer','downs','downy','dowry','dowse','doze','dozed','dozen','dozens','dozer',
'dozes','dozing','drab','drabs','draft','drafts','drafty','drag','dragon','drags','drain','drains','drake','drakes','dram','drama','drams','drank','drape','draped',
'draper','drapes','draw','drawee','drawer','drawl','drawn','draws','dray','drays','dread','dream','dreams','dreamy','dreary','dreck','dredge','drench','dress','dressy',
'drew','drib','dried','drier','driers','dries','driest','drift','drifts','drill','drills','drink','drinks','drip','drippy','drips','drive','drivel','driver','drives',
'droids','droit','droll','drone','drones','drool','droop','droops','droopy','drop','drops','dropsy','dross','drouth','drove','droves','drown','drowns','drowse','drowsy',
'drudge','drug','drugs','druid','druids','drum','drums','drunk','drunks','dry','dryer','dryly','drys','dual','dually','duals','dub','dubbed','dubs','ducal',
'duck','ducked','ducks','ducky','duct','ducts','dud','duddy','dude','dudes','duds','due','duel','dueled','dueler','duels','dues','duet','duets','duffs',
'dug','duke','duked','dukes','dull','dulled','dulls','dully','duly','dumber','dumbly','dumbo','dumbs','dumdum','dummy','dump','dumped','dumper','dumps','dumpy',
'dun','dunce','dunces','dune','dunes','dung','dungs','dungy','dunk','dunks','duo','dupe','duped','duper','dupers','dupes','duplex','durned','durst','dusk',
'dusky','dust','dusted','duster','dusty','dutch','duties','duty','duvet','dwarf','dwarfs','dwell','dwells','dwelt','dyadic','dye','dyed','dyer','dyers','dyes',
'dying','dyke','dykes','dynamo','dynast','each','eager','eagle','ear','earful','earing','earl','earls','early','earn','earned','earner','earns','ears','earth',
'earths','earthy','ease','eased','easel','eases','easier','easily','easing','east','easter','easy','eat','eaten','eater','eaters','eating','eats','eave','eavers',
'eaves','ebb','ebbed','ebbing','ebbs','ebony','echo','echoes','echoey','eclair','eddy','edema','edg','edge','edged','edger','edges','edgier','edging','edgy',
'edict','edit','edited','editor','edits','educed','eel','eels','eerie','egads','egg','egged','eggos','eggs','ego','egoism','egoist','egos','egress','eider',
'eight','eighth','eighty','either','eject','ejects','eking','elate','elated','elater','elbow','elder','eldest','elect','elects','elegy','eleven','elf','elfin','elfish',
'elicit','elide','elided','elides','elite','elites','elk','elkdom','elm','elope','eloped','elopes','elude','eluded','eluder','eludes','elves','elvish','email','emails',
'embark','embars','embed','embeds','ember','embers','emblem','embody','emboss','embryo','emcee','emerge','emerod','emery','emetic','emigre','emit','emits','emote','emoted',
'emotes','empire','employ','empty','emu','emus','enable','enact','enamel','enamor','encage','encamp','encase','encode','encore','encyst','end','ended','ender','ending',
'endive','endow','ends','endure','enemy','energy','engage','engine','engulf','enjoy','enjoys','enlace','enlist','enmesh','enmity','ennui','enough','enrage','enrich','enrobe',
'enrol','enroll','ensign','ensued','ensure','entail','enter','enters','entice','entire','entity','entomb','entrap','entree','entry','envied','envies','envoy','envoys','envy',
'enzyme','epic','epoch','epochs','eponym','epoxy','equal','equals','equate','equip','equips','equity','era','erase','erased','eraser','erases','ere','erect','erects',
'ergo','ergs','ermine','erode','eroded','erodes','erotic','err','errand','errant','error','errors','errs','eructs','erupt','erupts','escape','eschew','escort','essay',
'essays','essent','estate','esteem','esters','estops','etalon','ether','ethic','ethics','ethnic','ethos','etudes','evacue','evade','evaded','evader','evades','eve','even',
'evened','evenly','evens','event','events','ever','everts','every','eves','evict','evicts','evil','evils','evince','evoke','evoked','evokes','evolve','ewe','ewer',
'exact','exacts','exalt','exam','exams','exceed','excel','excels','except','excess','excise','excite','excuse','exec','exert','exhale','exhort','exhume','exile','exiled',
'exiles','exist','exists','exit','exited','exits','expand','expat','expect','expels','expend','expert','expire','expiry','expo','export','expos','expose','expugn','extend',
'extent','extern','extol','extra','extras','exude','eye','eyed','eyeful','eyelid','eyes','eying','eyrie','fab','fable','fabled','fabler','fables','fabric','facade',
'face','faced','facer','facers','faces','facet','facets','facial','facile','facing','fact','factor','facts','facula','fad','fade','faded','fader','fades','fading',
'fads','fagged','faggot','fail','failed','fails','faint','fair','fairly','fairy','faith','faiths','fake','faked','faker','fakes','faking','falcon','fall','fallen',
'faller','fallow','falls','false','falser','falsie','falter','fame','famed','fames','family','famine','famous','fan','fancy','fandom','fang','fangs','fanin','fanned',
'fanny','fanout','fans','far','farce','fare','fared','fares','farm','farmer','farms','farrow','fart','farts','fascia','fast','fasted','fasten','faster','fat',
'fatal','fate','fated','fates','father','fathom','fats','fatso','fatten','fatty','fatwa','fault','faulty','fauna','faunal','faunas','fauns','favas','faves','favor',
'favors','fawn','fawned','fawner','fawns','fax','faxed','faxes','faze','fazed','fazes','fealty','feared','fearer','feast','feasts','feat','feater','feats','feazed',
'fecal','feces','fecund','fed','fedora','feds','fee','feebly','feed','feeder','feeds','feel','feeler','feels','fees','feet','feign','feigns','feint','feints',
'feline','fell','felled','feller','fellow','fells','felon','felons','felony','felt','felts','female','femme','femur','femurs','fen','fence','fenced','fencer','fences',
'fend','fended','fender','fends','fennec','fennel','fenny','feral','fern','ferns','ferny','ferret','ferric','ferris','ferry','ferule','fervid','fervor','fest','festal',
'fester','fests','fetal','fetals','fetch','feted','fetes','fetid','feting','fetish','fetter','fetus','feud','feuds','fever','few','fewer','fewest','feyest','fiasco',
'fiat','fiats','fib','fibbed','fibber','fiber','fibers','fibre','fibs','fibula','fiche','fichu','fickle','ficus','fiddle','fidget','fief','field','fields','fiend',
'fiends','fierce','fiery','fiesta','fifth','fifths','fifty','fig','fight','figure','filch','file','filed','filer','files','filial','filing','fill','filled','filler',
'fillet','fillip','fills','filly','film','films','filmy','filth','filthy','fin','final','finals','finch','find','finder','finds','fine','fined','finer','fines',
'finest','finger','finial','finish','finite','fink','finks','finned','finny','fins','fiord','fiords','fir','fire','fired','firer','fires','firing','firm','firman',
'firmed','firmer','firmly','firms','firs','first','firsts','fiscal','fish','fished','fisher','fishes','fishy','fist','fists','fit','fitful','fitly','fits','fitted',
'fitter','five','fix','fixed','fixer','fixers','fixes','fixing','fixity','fizzle','fizzy','fjord','flabby','flack','flacks','flag','flagon','flags','flails','flair',
'flairs','flak','flake','flaked','flaker','flakes','flaks','flaky','flam','flambe','flame','flamed','flamer','flames','flams','flan','flange','flank','flanks','flans',
'flap','flappy','flaps','flare','flared','flares','flash','flashy','flask','flasks','flat','flatly','flats','flaw','flawed','flaws','flax','flaxen','flaxy','flay',
'flays','flea','fleams','fleas','fleck','flecks','fled','fledge','fledgy','flee','fleece','fleecy','flees','fleet','fleets','flesh','fleshy','flew','flex','flexed',
'flexes','flick','flicks','flier','fliers','flies','flight','flimsy','flinch','fling','flings','flint','flints','flinty','flip','flippy','flips','flirt','flirts','flit',
'flits','float','floats','flock','flocky','floes','flog','flogs','flood','floods','floor','floors','floosy','floozy','flop','floppy','flops','flora','floral','floret',
'florid','florin','floss','flossy','flour','flours','floury','flout','flouts','flow','flowed','flower','flown','flows','flu','flub','flubs','flue','fluent','flues',
'fluff','fluffs','fluffy','fluid','fluids','fluke','fluked','flukes','flukey','fluky','flume','flung','flunk','flunks','flunky','flurry','flush','flushy','flute','fluted',
'fluter','flutes','fluty','flux','fluxes','fly','flyby','flybys','flyer','flyers','flying','foaled','foals','foam','foamed','foamer','foamy','fob','fobbed','fobs',
'focal','foci','focus','fodder','foe','foes','fog','fogey','fogged','fogger','foggy','fogies','fogs','foible','foil','foiled','foils','foist','foists','folded',
'folder','folds','foliar','folio','folk','folks','folksy','follow','folly','fond','fondly','fondue','font','fonts','food','foodie','foods','fool','fooled','fools',
'foot','footed','footer','footle','foots','footy','fop','for','forage','foray','forays','forbid','force','forced','forcer','forces','ford','forded','fordid','fore',
'forego','forest','forge','forged','forger','forges','forget','forgo','forgot','fork','forked','forker','forks','form','formal','format','formed','former','formic','forms',
'fort','forte','forth','forts','forty','forum','forums','fosse','fossil','foster','fought','foul','fouled','fouler','foully','found','founds','fount','four','fours',
'fourth','fowl','fowled','fowls','fox','foxes','foxier','foxing','foxy','foyer','foyers','fracas','frack','frags','fraidy','frail','frails','frame','framed','framer',
'frames','franc','francs','frank','franks','frats','fraud','frauds','frawns','fray','frayed','frays','freak','freaks','freaky','free','freed','freely','freer','frees',
'freest','freeze','frenzy','fresco','fresh','fret','fretty','friar','friars','fridge','fried','friend','frier','friers','fries','frieze','fright','frigid','frill','frills',
'frilly','fringe','fringy','frisk','frisks','frisky','frizz','frizzy','frock','frocks','frog','froggy','frogs','frolic','from','front','fronts','frost','frosts','frosty',
'froth','froths','frothy','frown','frowns','frowst','frowzy','froze','frozen','frugal','fruit','fruits','fruity','frump','frumps','frumpy','fry','fryer','frying','frypan',
'fub','fucked','fucker','fucks','fuckup','fuddle','fudge','fudged','fudges','fuel','fueled','fueler','fuels','fugu','fugue','fugued','fugues','full','fulled','fuller',
'fulls','fully','fumble','fume','fumed','fumer','fumes','fumier','fuming','fumy','fun','fund','funded','funds','fundus','funest','fungal','fungi','fungus','funk',
'funked','funker','funks','funky','funned','funnel','funny','fur','furl','furled','furors','furred','furrow','furry','fury','fuse','fused','fuses','fusing','fusion',
'fuss','fussed','fusser','fusses','fussy','fusty','futile','futon','future','fuzz','fuzzes','fuzzle','fuzzy','gab','gabled','gabler','gables','gabs','gadded','gadder',
'gadget','gads','gaff','gaffer','gaffes','gag','gage','gagged','gagger','gaggle','gags','gaiety','gaily','gain','gained','gainer','gains','gait','gaiter','gaits',
'gal','gala','galaxy','gale','gales','gall','galled','galley','gallop','galls','galore','gam','gambit','gamble','gambol','game','gamed','gamely','gamer','gamers',
'games','gamest','gamey','gamin','gamine','gaming','gamins','gamma','gammas','gammon','gamut','gamy','gander','ganged','ganger','gangly','gangs','gangue','gannet','gantry',
'gaoled','gaoler','gap','gape','gaped','gaper','gapers','gapes','gaping','gapped','gaps','garage','garb','garbed','garble','garbs','garcon','garden','gargle','garish',
'garlic','garner','garnet','garter','gas','gases','gash','gashed','gasher','gashes','gasify','gasket','gaslit','gasp','gasped','gasper','gasps','gassed','gasses','gassy',
'gate','gateau','gated','gates','gather','gating','gators','gauche','gaucho','gauge','gauged','gauger','gauges','gaumed','gaunt','gauze','gauzes','gauzy','gave','gavel',
'gawk','gawked','gawker','gawks','gawky','gawped','gawper','gawps','gay','gays','gaze','gazebo','gazer','gazers','gazes','gazing','gear','geared','gears','gecko',
'geckos','gee','geek','geeks','geeky','gees','geese','geezed','geezer','geisha','gel','gelded','gelder','gelds','gelees','gelled','gels','gem','gems','gender',
'gene','genera','genes','genial','genie','genies','genii','genius','genre','genres','gent','gentle','gently','gentry','gents','genus','geodes','geodic','geoids','gerbil',
'germ','german','germs','gerund','get','gets','geyser','ghetto','ghost','ghosts','ghouls','giant','giants','gibbed','gibber','gibbet','gibing','giblet','gift','gifted',
'gifts','gig','giggle','giggly','gigolo','gigs','gild','gilded','gilder','gilds','gilled','gills','gilt','gilts','gimbal','gimbel','gimlet','gimme','gimp','gimped',
'gimps','gimpy','gin','ginger','gingko','ginkgo','gins','gird','girded','girder','girdle','girds','girl','girlie','girls','girly','girted','girth','girths','girts',
'gist','give','given','giver','gives','giving','gizmo','gizmos','glacis','glad','glade','glades','gladly','glads','glam','glance','gland','glands','glare','glared',
'glares','glass','glassy','glaze','glazed','glazer','glazes','gleam','gleams','gleamy','glean','gleans','glebe','glebes','gleeds','gleeks','glees','gleets','gleety','glegly',
'glen','glens','glib','glibly','glide','glided','glider','glides','gliffs','glim','glimed','glimes','glims','glint','glints','glinty','glitch','glitz','glitzy','gloams',
'gloat','gloats','glob','global','globe','globes','globs','gloom','glooms','gloomy','glop','gloppy','glory','gloss','glossy','glove','gloved','glover','gloves','glow',
'glowed','glower','glows','glozed','glozes','glue','glued','gluer','glues','gluey','glugs','gluier','gluing','glum','glumly','gluons','glut','glutch','glutei','gluten',
'gluts','glyph','gnarl','gnarls','gnarly','gnarrs','gnars','gnash','gnat','gnats','gnaw','gnawed','gnawer','gnawn','gnaws','gneiss','gnome','gnomes','gnomon','gnu',
'goad','goaded','goads','goal','goalie','goals','goanna','goat','goatee','goats','gob','gobbed','gobbet','gobble','gobies','goblet','goblin','gobs','god','goddam',
'godded','godly','gods','goer','goers','goes','gofer','goffed','goffer','goggle','going','gold','golds','golf','golfed','golfer','golfs','gonads','gone','goner',
'goners','gong','gonged','gongs','goniff','gonifs','gonna','goobed','goober','good','goodly','goods','goodys','gooey','goof','goofed','goofs','goofy','gooier','goon',
'goonda','goons','goopy','goose','goosey','gopher','gore','gored','gores','gorge','gorged','gorger','gorges','gorgon','gorily','goring','gorses','gory','gosh','gospel',
'gossip','got','gotcha','goth','gothic','gotta','gotten','gouda','gouge','gouged','gouger','gouges','gourd','gourds','gout','gouts','gouty','govern','gown','gowned',
'gowns','grab','graben','grace','graced','graces','grad','grade','graded','grader','grades','grads','graft','grafts','grail','grails','grain','grains','grainy','gram',
'grams','grand','grands','grange','grant','grants','grape','grapes','graph','graphs','grasp','grasps','grass','grassy','grate','grated','grater','grates','gratia','gratin',
'grave','graved','gravel','graven','graver','graves','gravid','gravy','gray','grays','graze','grazed','grazer','grazes','grease','greasy','great','greats','greave','greed',
'greeds','greedy','greek','greeks','green','greens','greet','greets','grew','grey','greys','grid','grief','griefs','grieve','griffs','grifts','grill','grille','grills',
'grilse','grim','grime','grimed','grimes','grimly','grimy','grin','grind','grinds','grins','griot','griots','grip','gripe','griped','griper','gripes','grips','grisly',
'grist','grists','grit','grits','gritty','groan','groans','groat','groats','grocer','grog','groggy','groin','groins','groom','grooms','groove','groovy','grope','groped',
'groper','gropes','gross','grouch','ground','group','groups','grouse','grout','grouts','grouty','grove','groved','grovel','groves','grow','grower','growl','growls','grown',
'grows','growth','grub','grubby','grubs','grudge','gruel','gruels','gruff','gruffs','gruffy','grump','grumps','grumpy','grungy','grunt','grunts','guacos','guano','guanos',
'guard','guards','guava','guavas','guck','guess','guest','guests','guff','guffaw','guide','guided','guider','guides','guild','guilds','guilt','guilty','guimpe','guise',
'guises','guitar','gulags','gulch','gulden','gulf','gulfs','gulled','gullet','gulls','gulp','gulped','gulper','gulps','gum','gumbos','gummed','gummy','gumps','gums',
'gun','gundog','gunite','gunk','gunked','gunks','gunky','gunman','gunmen','gunned','gunnel','gunner','gunny','guns','gunsel','gurgle','guru','gush','gushed','gusher',
'gushes','gusset','gust','gusted','gusts','gusty','gut','guts','gutsy','gutta','guttae','gutted','gutter','guy','guyed','guying','guys','guzzle','gym','gyms',
'gypped','gypper','gypsum','gypsy','gyrate','gyrene','habile','habits','hack','hacked','hacker','hackle','had','hadean','hadjes','hadjis','haeing','haft','hafted','hafter',
'hag','hagged','haggis','haggle','hags','hail','hailed','hailer','hair','hairdo','haired','hajjes','hajjis','hale','halest','half','halide','haling','halite','hall',
'hallah','hallel','halloa','halloo','hallos','hallot','hallow','halo','haloed','haloid','halt','halted','halter','halutz','halved','halver','halves','ham','hamlet','hammal',
'hammam','hammed','hammer','hamper','hams','hand','handed','hander','handle','hang','hangar','hanged','hanger','hangup','hank','hanked','hanker','hankie','happen','haps',
'hapten','harass','harbor','hard','harder','hardly','hare','harems','haring','hark','harked','harken','harlot','harm','harmed','harmer','harp','harped','harper','harrow',
'has','hash','hashed','hasher','hashes','haslet','hasp','hasped','hassle','hast','hasted','hasten','hastes','hat','hatbox','hate','haters','hatful','hath','hating',
'hatpin','hatred','hats','hatted','hatter','haul','hauled','hauler','haunch','haunts','hausen','have','havens','having','haw','hawing','hawk','hawked','hawker','hawser',
'hay','hayers','haying','hays','hazard','haze','hazels','hazers','hazier','hazily','hazing','hazy','head','headed','header','heal','healed','healer','health','heap',
'heaped','hear','hearer','hearst','hearts','hearty','heat','heated','heater','heaths','heathy','heaved','heaven','heaver','heaves','heck','heckle','hectic','hedged','hedger',
'hedges','heed','heeded','heeder','heehaw','heel','heeled','heeler','heft','heifer','height','heinie','heir','heists','held','helios','helium','hell','helled','heller',
'hellos','helm','helmet','help','helped','helper','hem','hemmed','hemmer','hemp','hems','hen','hennas','henrys','hens','hepcat','her','herald','herb','herbal',
'herbed','herd','herded','herder','here','hereby','herein','hereof','herero','heresy','hermit','hero','heroes','heroic','herons','herpes','hers','hew','hewn','hews',
'hiatal','hiatus','hiccup','hick','hickey','hid','hidden','hide','hiders','hiding','higgle','high','higher','highly','hijack','hike','hikers','hiking','hill','hilled',
'hiller','hilloa','hillos','hilt','hilted','him','hims','hind','hinder','hinged','hinger','hinges','hint','hinted','hinter','hip','hipped','hipper','hippie','hips',
'hire','hiring','his','hiss','hissed','hisser','hisses','hit','hither','hits','hitter','hive','hoagie','hoards','hoarse','hoax','hoaxed','hoaxer','hoaxes','hob',
'hobbed','hobbit','hobble','hobnob','hobo','hobs','hock','hocker','hockey','hod','hods','hoe','hoed','hoer','hoes','hog','hogans','hogged','hogger','hogs',
'hogtie','hoiden','hoised','hoises','hoists','hoking','hokums','hold','holden','holder','holdup','hole','holier','holies','holily','holing','holist','holloa','hollow','holpen',
'holy','homage','hombre','home','homely','homers','homeys','homier','homily','homing','hominy','honcho','hondas','hone','honers','honest','honeys','honied','honing','honk',
'honked','honker','honors','hood','hooded','hoodie','hoodoo','hoof','hoofed','hoofer','hook','hooked','hooker','hookup','hoop','hooped','hooper','hoopla','hoopoe','hooray',
'hoot','hooted','hooter','hooves','hop','hope','hopers','hoping','hopped','hopper','hopple','hops','horded','hordes','horn','horned','hornet','horrid','horror','horsed',
'horses','hose','host','hosted','hostel','hot','hotbed','hotbox','hotdog','hotels','hotter','hottie','houdah','hounds','hour','hourly','housed','houser','houses','hovels',
'hovers','how','howdah','howdie','howl','howled','howler','hub','hubcap','hubris','hubs','huckle','huddle','hue','hued','hues','huff','huffed','hug','huge',
'hugely','hugest','hugged','hugger','hugs','hulas','hulk','hulked','hull','hulled','huller','hum','humane','humans','hummed','hummer','hummus','hump','humped','humper',
'humps','hums','hung','hunger','hungry','hunk','hunker','hunt','hunted','hunter','hurdle','hurl','hurled','hurler','hurrah','hurray','hurt','hurter','hush','hushed',
'hushes','husk','husked','husker','hussar','hustle','hut','huts','hutted','hybrid','hybris','hydrae','hydral','hydras','hydric','hydros','hyenas','hymens','hymnal','hymned',
'hype','hyphen','hypo','ibis','ice','iced','iceman','icemen','ices','iciest','icings','ickier','icky','icon','icy','idea','idem','ides','idiocy','idioms',
'idiots','idle','idlers','idlest','idling','idly','idol','iffy','ignite','ignore','iguana','ilk','ill','imaged','imager','images','imbibe','imbrue','imbued','imbues',
'immune','immure','imp','impact','impair','impala','impale','impart','impede','impels','impend','imping','impish','impose','impugn','impure','impute','inaner','inborn','inbred',
'incant','incase','incest','inch','incise','incite','income','incubi','incurs','indeed','indene','indent','indian','indict','indies','indigo','indite','indium','indoor','indows',
'induce','induct','indued','indues','infamy','infant','infare','infect','infers','infest','infirm','inflow','influx','info','inform','infuse','ingest','ingles','ingots','inhale',
'inhere','inject','injure','injury','ink','inkier','inking','inks','inky','inlaid','inland','inlays','inlets','inmate','inmost','inn','innate','inners','inning','inns',
'inputs','inroad','insane','insect','insert','inside','insist','insole','inspan','insult','insure','intact','intake','intend','intent','intern','inters','into','intone','intros',
'intuit','inulin','inured','inures','invade','invars','invent','invert','invest','invite','invoke','inward','iodide','iodine','iodise','iodize','iodous','ion','ionics','ionise',
'ionize','ionone','ions','iota','ipecac','irades','irater','ire','ireful','irenic','irides','iris','irised','irises','irk','irking','irks','iron','ironed','ironer',
'ironic','island','isle','islets','isobar','isogon','isohel','isomer','issued','issuer','issues','isthmi','italic','itch','itched','itches','item','its','itself','ivy',
'izzard','jab','jabbed','jabber','jabiru','jabots','jabs','jack','jackal','jacked','jacket','jade','jading','jadish','jaeger','jag','jagers','jagged','jagger','jags',
'jaguar','jail','jailed','jailer','jailor','jake','jalopy','jam','jamb','jambed','jammed','jammer','jams','jane','jangle','janity','japans','jape','japers','japery',
'japing','jar','jarful','jarred','jars','jasper','jaunce','jaunts','jaunty','java','jaw','jawing','jaws','jay','jaygee','jays','jayvee','jazz','jazzed','jazzer',
'jazzes','jean','jeaned','jedi','jeeing','jeep','jeer','jeered','jeerer','jejuna','jejune','jell','jellab','jelled','jennet','jerboa','jereed','jerids','jerk','jerked',
'jerker','jerkin','jersey','jessed','jesses','jest','jested','jester','jesuit','jet','jets','jetsam','jetsom','jetted','jetton','jetway','jewels','jezail','jib','jibbed',
'jibber','jibe','jibing','jibs','jiff','jig','jigged','jiggle','jiggly','jigs','jigsaw','jihads','jilt','jilted','jilter','jiminy','jimp','jimply','jingle','jingly',
'jink','jinx','jitney','jitter','jive','jivers','jiving','job','jobbed','jobber','jobs','jock','jockey','jocose','jocund','jog','jogged','jogger','joggle','jogs',
'john','join','joined','joiner','joints','joists','jojoba','joke','jokers','jokier','joking','joky','jolt','jolted','jolter','jorams','jordan','jorums','joseph','josh',
'joshed','josher','joshes','jostle','jot','jots','jotted','jotter','jouals','jouked','joules','jounce','jouncy','journo','jousts','jovial','jowars','jowing','jowl','joy',
'joyful','joying','joyous','joys','jubbah','judges','judo','judogi','judoka','jug','jugate','jugful','jugged','juggle','jugs','jugula','juiced','juicer','juices','jujube',
'juking','juleps','jumbal','jumble','jumbos','jump','jumped','jumper','junco','juncos','june','jungle','junior','junk','junked','junker','junket','junkie','juntas','jupons',
'jurant','jurats','jurels','juries','jurist','jurors','jury','just','justed','juster','justly','jut','juts','jutted','kababs','kabala','kabars','kabaya','kabiki','kabobs',
'kabuki','kaccha','kachis','kafirs','kaftan','kahuna','kainit','kaiser','kaizen','kakapo','kalams','kale','kalian','kalif','kalifs','kalium','kalmia','kalong','kamala','kamiks',
'kamilk','kanaka','kanban','kanjis','kanzus','kaolin','kaonic','kapoks','kappas','kaputt','karats','karens','karmas','kayo','kays','keen','keep','keg','kegs','kelp',
'kemp','ken','keno','kept','kern','key','keys','kick','kid','kids','kill','kiln','kilo','kilt','kin','kind','king','kink','kino','kips',
'kiss','kit','kite','kiting','kits','kitten','kittle','klatch','klaxon','klepht','klicks','kliegs','kloofs','kluged','kluges','klutzy','knacks','knaves','kneads','knee',
'kneels','knells','knew','knifed','knifer','knifes','knight','knit','knives','knob','knobby','knocks','knolls','knot','knotty','knouts','know','knowns','knurls','knurly',
'koalas','kobold','koines','kolhoz','kopeck','kopeks','koppas','koppie','kormas','koruna','kosher','kotows','kraals','krafts','kraits','krater','krauts','kreeps','krills','krises',
'kronen','kroner','kronor','kuchen','kugels','kukris','kulaki','kulaks','kumiss','kurgan','kurtas','kvases','kvetch','kwacha','kwanza','kybosh','kyries','kythed','kythes','lab',
'labels','labial','labile','labium','labors','labour','labret','labrum','labs','lac','lace','lacers','lacier','lacing','lack','lacked','lacker','lackey','lactam','lactic',
'lacuna','lacy','lad','ladder','laddie','ladens','laders','ladies','lading','ladino','ladled','ladler','ladles','ladron','lads','lady','lag','lagans','lagend','lagers',
'lagged','lagger','lagoon','lags','laguna','lahars','laical','laichs','laid','laighs','lair','lairds','laired','lake','lakers','lakier','laking','lallan','lam','lamb',
'lambda','lambed','lambie','lame','lameds','lamely','lament','lamest','lamiae','lamias','laming','lammed','lamp','lampad','lampas','lamped','lan','lanai','lanais','lanced',
'lancer','lances','lancet','land','landau','landed','lander','lane','lanely','langue','langur','lanker','lankly','lanner','lanose','lap','lapdog','lapels','lapful','lapins',
'lapped','lapper','lappet','laps','lapsed','lapser','lapses','laptop','lard','larded','larder','lardon','larees','larger','larges','largos','lariat','larine','lark','larked',
'larker','larrup','lars','larums','larvae','larval','larvas','larynx','lase','lasers','lash','lashed','lasher','lashes','lasing','lass','lassie','lassos','last','lasted',
'laster','lastly','late','lateen','lately','latens','latent','latest','lath','lathed','lather','lathes','latigo','latina','latino','latish','latkes','latria','lats','latten',
'latter','lattes','lauans','laud','lauded','lauder','laughs','launch','laurae','lauras','laurel','lavabo','lavage','lavash','lave','lavers','laving','lavish','lavs','law',
'lawful','lawing','lawman','lawmen','lawn','laws','lawyer','lax','laxest','laxity','lay','layers','laying','laymen','layout','lays','layups','lazars','laze','lazied',
'lazier','lazies','lazily','lazing','lazy','lea','leachy','lead','leaded','leaden','leader','leaf','leafed','league','leak','leaked','leaker','leally','lealty','lean',
'leaned','leaner','leanly','leap','leaped','leaper','lear','learns','learnt','leas','leased','leaser','leases','leasts','leaved','leaven','leaver','leaves','lebens','lech',
'lecher','leches','led','ledger','ledges','lee','leer','leered','lees','leeway','left','leg','legacy','legals','legate','legato','legend','legers','legged','leggin',
'legion','legist','legits','legman','legs','legume','lemans','lemmas','lemons','lemony','lemurs','lend','lender','length','lenite','lenity','lens','lensed','lenses','lent',
'lenten','lentic','lentil','leonas','lepers','lepton','lesbos','lesion','less','lessee','lessen','lesser','lesson','lessor','lest','let','lethal','lethes','letted','letter',
'letups','leucin','leucon','levant','leveed','levees','levels','levers','levied','levier','levies','levins','levity','levy','lewder','lewdly','lexeme','lexica','liaise','lianas',
'lianes','liangs','liar','libber','libels','libers','libido','librae','libras','libs','lice','lichee','lichen','liches','lick','licked','licker','lid','lidars','lidded',
'lids','lie','lied','lieder','lien','lies','lieu','life','lifers','lift','lifted','lifter','ligand','ligans','ligate','lights','lignin','ligula','ligule','like',
'likely','likens','likers','likest','liking','lilacs','lilied','lilies','lilt','lilted','lily','limans','limb','limbas','limbed','limber','limbic','limbos','lime','limeys',
'limier','liming','limits','limned','limner','limnic','limp','limpas','limped','limper','limpet','limpid','limply','limpsy','limy','linacs','linage','linden','line','lineal',
'linear','lineas','linens','liners','lineup','ling','lingam','lingas','linger','lingos','lingua','linier','lining','link','linked','linker','linkup','linnet','linsey','lint',
'linted','lintel','linter','lintol','lion','lionet','lip','lipase','lipide','lipids','lipoid','lipoma','lipped','lippen','lips','liquid','liquor','lisp','lisper','list',
'listed','listee','listen','lister','lit','litchi','lite','liters','lither','lithia','lithic','lithos','litmus','litter','little','live','lively','livens','livery','livest',
'liveth','livier','living','lizard','llamas','llanos','load','loaf','loafer','loam','loamed','loan','loaner','loathe','loaves','lob','lobate','lobbed','lobber','lobe',
'lobs','lobule','locale','locals','locate','loch','lock','locked','locker','locket','lockup','loco','locoed','locoes','locums','locust','lode','lodged','lodger','lodges',
'loess','loft','lofted','lofter','log','loge','logged','logger','loggia','loggie','logics','logins','logion','logjam','loglog','logo','logs','logway','loided','loin',
'loiter','lolled','loller','lone','lonely','loners','long','longed','longer','longly','loofah','looies','looing','look','looked','looker','lookup','loom','loomed','loon',
'looner','looney','loop','looped','looper','loopie','loosed','loosen','looser','looses','loot','looted','looter','lop','lope','lopers','loping','lopped','lopper','lops',
'loquat','lorans','lord','lorded','lordly','lore','loreal','lorn','lory','lose','losers','losing','loss','losses','lost','lostly','lot','loth','lots','lotted',
'lotter','lottie','louche','loud','louden','louder','loudly','loughs','louies','loumas','lounge','loungy','louped','loupen','loupes','lour','loured','loused','louses','lout',
'louver','louvre','lovage','love','lovely','lovers','loving','low','lowboy','lowers','lowery','lowest','lowing','lowish','lows','lox','lubber','lucent','lucern','luck',
'lucked','luckie','lucres','ludo','luff','lug','luge','lugs','lull','lumbar','lumber','lumens','lumina','lummox','lump','lumped','lumpen','lumper','lums','lunacy',
'lunars','lunate','lunchy','lung','lunged','lungee','lunger','lunges','lunier','lunies','lunk','lunker','lunted','lupine','lupins','lupous','lurdan','lure','lurers','luring',
'lurk','lurked','lurker','lush','lushed','lusher','lushes','lushly','lust','lusted','luster','lustre','lusuin','lute','luteum','luther','luting','lutist','lutzes','luxate',
'luxury','lyases','lycees','lyings','lymph','lympho','lynx','lynxes','lyrate','lyre','lyrics','lyrist','lysate','lysine','lysing','lyssas','mac','macaco','macaws','mace',
'macers','mach','macher','maches','machos','mackle','macles','macons','macros','macs','macula','mad','madame','madams','madcap','madden','madder','made','madeup','madman',
'madmen','madras','madrid','maenad','mafia','mafias','mafics','maftir','mage','magi','magnum','magots','maguey','magyar','mahout','maid','maiden','maigre','mail','mailed',
'mailer','mailes','maills','maim','maimed','maimer','main','mainly','maists','maizes','majeur','majors','make','makers','makeup','making','malady','malars','malate','male',
'malfed','malgre','malice','malign','maline','mall','malled','mallee','mallet','mallow','malt','malted','maltha','maltol','mama','mambas','mambos','mammal','mammas','mammey',
'mammie','mammon','man','manage','manats','manche','mandis','mane','manege','manful','mangas','mangel','manger','manges','mangle','mangos','maniac','manias','manics','manila',
'manioc','manito','manitu','manned','manner','manors','manque','mans','manses','mantic','mantid','mantis','mantle','mantra','manual','manure','many','map','maples','mapped',
'mapper','maps','mar','maraca','maraud','marble','marbly','marcel','mare','margay','margin','marine','marish','mark','marked','marker','market','markka','markup','marled',
'marlin','marmot','maroon','marque','marram','marred','marrer','marron','marrow','mars','marshy','marten','martin','martyr','marvel','marvin','masala','mascon','mascot','masers',
'mash','mashed','masher','mashes','masjid','mask','masked','maskeg','masker','masons','masque','mass','massas','massed','masses','mast','master','mastic','mastix','mat',
'mate','math','matrix','matron','mats','matsah','matted','matter','mattes','mature','matzah','matzas','matzoh','matzos','matzot','mauger','maugre','maul','mauled','mauler',
'maunds','maundy','mavens','mavies','mavins','maw','mawing','maws','max','maxima','maxims','maxing','may','maybes','mayest','mayhap','mayhem','maying','mayo','mayors',
'maypop','mazard','maze','mazers','mazier','mazily','mazing','mazuma','mead','meadow','meager','meagre','meal','mealie','mean','meaner','meanie','meanly','measle','measly',
'meat','meatus','medals','meddle','medfly','medial','median','medias','medick','medico','medics','medium','medius','medlar','medley','medusa','meek','meeker','meekly','meet',
'meeter','meetly','megass','megohm','meinie','meld','melded','melder','melees','melled','mellow','melody','meloid','melons','melt','melted','melter','melton','member','memo',
'memoir','memory','men','menace','menads','mend','mended','mender','menhir','menial','mensae','mensal','mensas','mensch','mensed','menses','mental','mentor','mentum','menu',
'meow','mercer','mere','merely','merest','merged','mergee','merger','merges','merino','merits','merlin','merlon','merlot','merman','mermen','mescal','mesh','meshed','meshes',
'mesial','mesian','mesnes','mesons','mess','messed','messrs','mestee','met','meta','metals','metate','mete','meteor','meters','method','methyl','metier','meting','metope',
'metred','metres','metric','metros','mettle','mewing','miasma','miasms','miauls','mice','mickey','micron','micros','mid','midair','midday','midden','middle','midges','midget',
'midgut','midi','midleg','midrib','mids','midsts','midway','miff','miffed','mighty','mignon','mikado','mike','miking','milady','mild','milder','mildew','mildly','mile',
'milieu','milk','milked','milker','mill','milled','miller','millet','milord','milted','milter','mimbar','mime','mimers','mimics','miming','minced','mincer','minces','mind',
'minded','minder','mine','miners','mingle','mini','minier','minify','minima','minims','mining','minion','minish','minium','mink','minkes','minnow','minors','mint','minted',
'minter','minuet','minute','minx','minxes','mioses','miosis','miotic','mirach','mirage','mire','mirier','miring','mirk','mirror','miry','misact','misadd','misaim','miscue',
'miscut','misdid','miseat','misers','misery','misfed','misfit','mishap','mishit','miskal','mislay','misled','mislit','mismet','miss','missel','misses','misset','missis','missus',
'mist','misted','mister','mistic','misuse','mite','miters','mither','mitier','mitral','mitred','mitres','mitt','mitten','mix','mixers','mixing','mixups','mizens','mizuna',
'mizzen','moan','moaned','moaner','moat','moated','mob','mobbed','mobber','mobile','mobs','mock','mocker','mockup','mod','modals','mode','models','modem','modest',
'modify','mods','module','moduli','modulo','mohair','mohawk','mohels','moiety','moiled','moiler','moiras','moists','molars','mold','molded','molder','mole','molest','molies',
'moline','mollie','moloch','molt','molted','molten','molter','mom','moment','moms','monads','moneys','monger','mongol','mongos','monied','monies','monish','monist','monk',
'monkey','monody','months','mood','mooing','moolah','moolas','moon','mooned','mooner','moor','moored','mooris','moos','moot','mooted','mooter','mop','mope','mopers',
'mopery','mopier','moping','mopped','mopper','moppet','mops','morale','morals','morass','morays','morbid','more','moreen','morgue','morion','morn','morned','morons','morose',
'morpho','morphs','morros','morrow','morsel','mort','mortar','mosaic','moseys','mosque','moss','mossed','mosses','most','mostly','motels','motet','moth','mother','motifs',
'motile','motion','motive','motley','motmot','motors','mottle','moulds','mouldy','moulin','moults','mounds','mounts','mousey','mousse','mouton','move','movers','movies','moving',
'mow','mowers','mowing','mows','much','muck','mucked','mucker','muckle','mucoid','mucors','mucosa','mucose','mucous','mud','mudcap','mudcat','mudded','mudder','muddle',
'muddly','mudras','muds','muesli','muff','muffed','muffin','muffle','mug','muggar','mugged','mugger','mugs','mujiks','mukluk','mulcts','mule','muleta','muleys','mulish',
'mull','mullah','mullas','mulled','mullet','mulley','mum','mumble','mumm','mummed','mummer','mumped','mumper','mums','mundos','mung','mungos','muns','muntin','muonic',
'murage','murals','murder','murine','muring','murk','murker','murkly','murres','murrey','muscid','muscle','muscly','muse','musers','museum','mush','mushed','musher','mushes',
'musick','musics','musing','musjid','musk','muskeg','musket','muskie','muslin','muss','mussed','mussel','musses','must','musted','mustee','muster','mutant','mutase','mutate',
'mute','mutely','mutest','mutine','muting','mutism','mutons','mutt','mutter','mutton','mutual','mutule','muumuu','muzzle','myases','myasis','mycele','mynahs','myomas','myoses',
'myosis','myotic','myriad','myrrhs','myself','mystic','mythic','mythos','nab','nabbed','nabber','nabobs','nabs','nachos','nadirs','naevus','naffer','naffly','nag','nagana',
'nagged','nagger','naggy','nags','nahums','naiads','nail','nailed','nailer','naiver','naives','naleds','name','namely','namers','naming','nan','nana','nances','nanism',
'nankin','nans','nantes','nap','nape','napkin','nappe','napped','napper','nappes','naps','narc','narial','narine','nark','narked','narrow','nary','nasals','nasion',
'nastic','natant','nation','native','natron','natter','nature','naught','nausea','nausei','naval','nave','navels','navies','navy','nawabs','nay','nays','neap','near',
'neared','nearer','nearly','neat','neaten','neater','neatly','nebula','neck','necked','nectar','need','needed','needer','needle','negate','neighs','nekton','nelson','neocon',
'neon','nephew','nerd','nereid','nerved','nerves','nervey','nest','nester','nestle','nestor','net','nether','nets','netted','netter','nettle','neural','neuron','neuter',
'nevoid','new','newest','newish','newlys','news','newsie','newt','newton','next','nib','nibbed','nibble','nibs','nice','nicely','nicest','nicety','niched','niches',
'nick','nicked','nickel','nicker','nickle','nieces','niello','nieves','niff','niffer','nigh','nighty','nihils','nil','nilgai','nilgau','nimble','nimbly','nimmed','nimrod',
'nine','ninety','ninjas','ninons','ninths','nip','nipped','nipper','nipple','nips','nit','nitros','nits','nitwit','nixies','nixing','nob','nobbut','nobler','nobles',
'nobody','nocked','nod','nodded','nodder','noddle','node','nods','nodule','noduli','noel','noesis','noetic','nogged','noggin','nogs','noised','noises','nomads','nomina',
'nonces','noncom','none','nonego','nonets','nonfat','nonpar','nook','noon','nope','nor','norm','normal','norths','nose','noshed','nosher','noshes','nosier','nosily',
'nosing','nosy','not','note','noting','nougat','nought','noun','nounal','nous','nouses','nova','novels','novena','novice','now','noways','nowise','nows','noyade',
'nub','nubbin','nubble','nubbly','nubile','nubs','nuclei','nude','nudest','nudged','nudger','nudges','nudism','nudist','nudity','nudnik','nugget','nuke','null','numb',
'numbed','number','numbly','numina','nun','nuncio','nuns','nurser','nurses','nut','nutate','nutlet','nutmeg','nutria','nuts','nutted','nutter','nuzzle','nybble','nylons',
'nympho','nymphs','oaf','oafish','oafs','oak','oakers','oakier','oaks','oakums','oar','oaring','oars','oat','oaters','oath','oats','obeahs','obelia','obelus',
'obey','obeyed','obeyer','obiism','object','objets','oblast','oblate','oblige','oblong','oboe','obsess','obtain','obtect','obtund','obtuse','obvert','occult','occupy','occurs',
'oceans','ocelli','ocelot','ochers','ochery','ochone','ochrea','ochres','ockers','ocreae','octads','octane','octant','octave','octavo','octets','octopi','octroi','octyls','oculus',
'odd','oddest','oddish','oddity','odds','ode','odeons','odes','odor','odored','odours','odyles','off','offend','offers','office','offing','offish','offs','offset',
'oft','ogdoad','oghams','ogival','ogives','ogle','oglers','ogling','ogre','ogress','ogrish','ogrism','ohed','ohedra','ohm','ohmage','ohms','oiks','oil','oilcan',
'oilcup','oilers','oilier','oilily','oiling','oilman','oils','oilway','oily','oink','oinked','okapis','okay','okayed','okra','old','oldest','oldies','oldish','olds',
'oleate','olefin','oleins','oleums','olingo','olives','omasum','omegas','omelet','omen','omit','onager','onagri','once','one','ones','onions','oniony','online','onload',
'only','onrush','onsets','onside','onto','onus','onuses','onward','onyxes','oohs','oolite','oolong','oomiak','oomphs','oopaks','oops','oosier','oosome','ootics','ooze',
'oozier','oozily','oozing','oozy','opal','open','opened','opener','openly','operas','operon','ophite','opiate','opined','opiner','opines','oppose','oppugn','opt','optics',
'optima','optime','opting','option','opts','opuses','orache','oracle','oral','orally','orated','orates','orator','orb','orbier','orbing','orbits','orbs','orca','orcein',
'orchid','orchis','ordain','ordeal','orders','ordure','ore','oreide','ores','orexis','organa','organs','orgasm','orgies','orgy','oribis','oriels','orient','origin','oriole',
'orison','ormers','ormolu','ornate','ornery','orphan','orphic','orpine','orpins','orrery','orthos','oscine','oscula','oscule','osetra','osiers','osmics','osmium','osmols','osmose',
'osmous','osprey','ossein','osteal','ostler','others','otic','otiose','otitic','otitis','ouch','ouched','ouches','oughts','ounces','ouphes','our','ourang','ourebi','ours',
'ousels','oust','ousted','ouster','out','outact','outadd','outage','outate','outbeg','outbid','outbox','outbuy','outbye','outcry','outdid','outeat','outers','outfit','outfly',
'outgas','outgun','outhit','outhow','outing','outjut','outlaw','outlay','outled','outlet','outlie','outman','outpay','output','outran','outrig','outrow','outrun','outs','outsat',
'outsaw','outsay','outsee','outset','outsit','outwar','outwit','outwon','ouvert','ouzo','oval','ovally','oven','over','overdo','overly','ovines','ovisac','ovoids','ovular',
'ovules','owe','owed','owes','owl','owlets','owlier','owlish','owls','own','owners','owning','owns','oxalic','oxalis','oxbows','oxcart','oxen','oxes','oxeyes',
'oxford','oxides','oxtail','oxygen','oxysms','oyster','ozalid','ozones','ozonic','pablum','pac','pace','pacers','pacier','pacify','pacing','pack','packed','packer','packet',
'pact','pad','padauk','padded','paddle','pads','paella','pagans','page','pagers','paging','pagoda','paid','paiked','pail','pain','pair','paired','pajama','pal',
'palace','palate','pale','palely','palest','palets','pall','pallid','palm','palmed','palmer','palp','palped','pals','paltry','pampas','pamper','pan','panada','panary',
'pander','pandit','pane','panels','panful','pang','pangas','panged','panics','panier','panini','panino','panned','panner','pannes','pans','pant','pantie','pantos','pantry',
'pap','papa','papacy','papain','papaya','papers','papery','paps','papuan','papyri','par','parade','paramo','parang','paraph','parcel','pardon','pare','parent','parers',
'pareus','parget','pariah','paring','parish','parity','park','parkas','parked','parker','parlay','parley','parody','parole','parols','parous','parrot','parsec','parsed','parser',
'parses','parson','part','parted','partly','parton','parure','pas','pase','pash','pass','passed','passes','passim','past','pastas','pasted','pastel','paster','pastes',
'pastor','pastry','pat','patchy','pate','paters','path','pathos','patina','patine','patios','patrol','patron','pats','patted','patter','paused','pauser','pauses','pavans',
'pave','pavers','paving','pavior','paw','pawn','pawned','pawnee','pawner','pawpaw','paws','pay','payday','payees','payers','paying','payola','payors','payout','pays',
'pea','peak','peal','pear','peas','peat','peck','pecs','peds','peek','peel','peep','peer','pees','peg','pegs','pelt','pen','pend','pens',
'pent','peon','pep','peps','per','perk','perm','perp','pert','peso','pest','pet','pets','pew','phew','phis','pica','pick','pics','pie',
'pied','pier','pies','pig','pigs','pike','pile','pill','pimp','pin','pine','ping','pink','pins','pint','piny','pion','pipe','pips','piss',
'pit','pita','pith','pits','pity','plan','plat','play','plea','pled','plod','plop','plot','plow','ploy','plug','plum','plus','ply','pock',
'pod','pods','poem','poet','poke','poky','pole','poll','polo','pom','pomp','pond','pony','pooh','pool','poop','poor','pop','pope','pops',
'pore','pork','porn','port','pose','posh','post','posy','pot','pots','pour','pout','pow','pox','pram','prat','pray','prep','prey','prig',
'prim','pro','prod','prom','prop','pros','prow','pry','prys','pub','pubs','puce','puck','puds','puff','pug','pugs','puke','pull','pulp',
'puma','pump','pun','puna','punk','puns','puny','pup','pupa','pups','pure','purl','purr','pus','push','puss','put','puts','putt','putz',
'rad','rag','ram','ran','rap','rat','raw','ray','red','ref','rep','rib','rid','rig','rim','rip','rob','rod','roe','romp',
'rot','row','rub','rue','rug','rum','run','rut','rye','sac','sad','sag','sap','sat','saw','sax','say','sea','set','sew',
'she','shy','sin','sip','sir','sis','sit','six','ska','ski','sky','sly','sob','sod','son','sop','sot','sow','soy','spa',
'spy','sty','sub','sue','sum','sun','sup','tab','tad','tag','tan','tap','tar','tat','taw','tax','tea','ted','tee','ten',
'the','thy','tic','tie','tin','tip','tit','toe','tog','tom','ton','too','top','tot','tow','toy','try','tub','tug','tun',
'two','ugh','ump','urn','use','van','vat','vet','vie','vim','vow','wad','wag','wan','wane','waned','war','was','wax','way',
'web','wed','wee','wet','who','wig','win','wit','woe','wok','won','woo','wow','yak','yam','yap','yaw','yea','yen','yep',
'yes','yet','yew','yin','yip','yon','you','yow','yup','zap','zed','zee','zen','zep','zip','zit','zoo',
]);

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 80) / 3;

const generateLetters = (): string[] => {
  const vowels = 'AEIOU';
  const consonants = 'BCDFGHLMNPRSTWY';
  const letters: string[] = [];
  for (let i = 0; i < 2; i++) {
    letters.push(vowels[Math.floor(Math.random() * vowels.length)]);
  }
  for (let i = 0; i < 4; i++) {
    letters.push(consonants[Math.floor(Math.random() * consonants.length)]);
  }
  return letters.sort(() => Math.random() - 0.5);
};

type GameMode = 'menu' | 'blitz' | 'standard';

export default function WordBuilder() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [letters, setLetters] = useState<string[]>(generateLetters());
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [message, setMessage] = useState('Tap letters to build words!');
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && gameMode !== 'menu' && !gameOver) {
      setGameOver(true);
      setMessage('Time\'s up!');
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameMode, gameOver]);

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setLetters(generateLetters());
    setSelectedIndices([]);
    setCurrentWord('');
    setScore(0);
    setFoundWords([]);
    setMessage('Tap letters to build words!');
    setGameOver(false);
    setTimeLeft(mode === 'blitz' ? 30 : 90);
  };

  const handleLetterPress = (index: number) => {
    if (gameOver) return;
    if (selectedIndices.includes(index)) {
      const newSelected = selectedIndices.filter(i => i !== index);
      setSelectedIndices(newSelected);
      setCurrentWord(newSelected.map(i => letters[i]).join(''));
    } else {
      const newSelected = [...selectedIndices, index];
      setSelectedIndices(newSelected);
      setCurrentWord(newSelected.map(i => letters[i]).join(''));
    }
  };

  const handleSubmit = () => {
    if (gameOver) return;
    const word = currentWord.toLowerCase();
    if (word.length < 3) { setMessage('Words must be at least 3 letters!'); return; }
    if (foundWords.includes(word)) { setMessage('Already found that word!'); return; }
    if (VALID_WORDS.has(word)) {
      const points = word.length * 10;
      setScore(score + points);
      setFoundWords([...foundWords, word]);
      setMessage(`+${points} points!`);
      setSelectedIndices([]);
      setCurrentWord('');
    } else {
      setMessage('Not a valid word!');
    }
  };

  const handleClear = () => {
    if (gameOver) return;
    setSelectedIndices([]);
    setCurrentWord('');
    setMessage('Tap letters to build words!');
  };

  const backToMenu = () => {
    setGameMode('menu');
    setGameOver(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameMode === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Word Builder</Text>
          <Text style={styles.menuSubtitle}>Choose your mode</Text>
          
          <TouchableOpacity style={styles.modeButton} onPress={() => startGame('blitz')}>
            <Text style={styles.modeEmoji}>⚡</Text>
            <View style={styles.modeInfo}>
              <Text style={styles.modeName}>Blitz Mode</Text>
              <Text style={styles.modeDescription}>30 seconds - Fast & furious!</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modeButton} onPress={() => startGame('standard')}>
            <Text style={styles.modeEmoji}>⏱️</Text>
            <View style={styles.modeInfo}>
              <Text style={styles.modeName}>Standard Mode</Text>
              <Text style={styles.modeDescription}>90 seconds - Take your time</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (gameOver) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>Time's Up!</Text>
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalScoreLabel}>points</Text>
          <Text style={styles.wordsFound}>You found {foundWords.length} words</Text>
          
          <View style={styles.foundWordsContainer}>
            <ScrollView style={styles.foundWordsScroll} contentContainerStyle={styles.foundWordsList}>
              {foundWords.map((word, index) => (
                <View key={index} style={styles.foundWordBadge}>
                  <Text style={styles.foundWordText}>{word.toUpperCase()}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          
          <TouchableOpacity style={styles.playAgainButton} onPress={() => startGame(gameMode)}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuButton} onPress={backToMenu}>
            <Text style={styles.menuButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={backToMenu}>
          <Text style={styles.backButton}>← Menu</Text>
        </TouchableOpacity>
        <Text style={[styles.timer, timeLeft <= 10 && styles.timerWarning]}>{formatTime(timeLeft)}</Text>
        <Text style={styles.score}>{score} pts</Text>
      </View>

      <Text style={styles.message}>{message}</Text>

      <View style={styles.wordDisplay}>
        <Text style={styles.currentWord}>{currentWord || '_ _ _'}</Text>
      </View>

      <View style={styles.letterGrid}>
        {letters.map((letter, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.letterTile, selectedIndices.includes(index) && styles.selectedTile]}
            onPress={() => handleLetterPress(index)}
          >
            <Text style={[styles.letterText, selectedIndices.includes(index) && styles.selectedText]}>{letter}</Text>
            {selectedIndices.includes(index) && (
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{selectedIndices.indexOf(index) + 1}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.foundWordsContainer}>
        <Text style={styles.foundWordsTitle}>Found Words ({foundWords.length}):</Text>
        <ScrollView style={styles.foundWordsScroll} contentContainerStyle={styles.foundWordsList}>
          {foundWords.map((word, index) => (
            <View key={index} style={styles.foundWordBadge}>
              <Text style={styles.foundWordText}>{word.toUpperCase()}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', paddingTop: 20 },
  menuContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  menuTitle: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  menuSubtitle: { fontSize: 18, color: '#888', marginBottom: 50 },
  modeButton: { flexDirection: 'row', backgroundColor: '#16213e', borderRadius: 20, padding: 20, width: '100%', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#0f3460' },
  modeEmoji: { fontSize: 40, marginRight: 20 },
  modeInfo: { flex: 1 },
  modeName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  modeDescription: { fontSize: 14, color: '#888' },
  gameOverContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  gameOverTitle: { fontSize: 36, fontWeight: 'bold', color: '#e94560', marginBottom: 20 },
  finalScore: { fontSize: 72, fontWeight: 'bold', color: '#4ecca3' },
  finalScoreLabel: { fontSize: 24, color: '#888', marginBottom: 10 },
  wordsFound: { fontSize: 18, color: '#fff', marginBottom: 20 },
  playAgainButton: { backgroundColor: '#4ecca3', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginBottom: 15 },
  playAgainText: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  menuButton: { backgroundColor: 'transparent', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, borderWidth: 1, borderColor: '#4ecca3' },
  menuButtonText: { fontSize: 16, color: '#4ecca3' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20, marginBottom: 10 },
  backButton: { fontSize: 16, color: '#4ecca3' },
  timer: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  timerWarning: { color: '#e94560' },
  score: { fontSize: 18, color: '#4ecca3', fontWeight: '600' },
  message: { fontSize: 16, color: '#888', marginBottom: 15, height: 20 },
  wordDisplay: { backgroundColor: '#16213e', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 15, marginBottom: 30, minWidth: 200, alignItems: 'center' },
  currentWord: { fontSize: 36, fontWeight: 'bold', color: '#fff', letterSpacing: 4 },
  letterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: width - 40, gap: 10, marginBottom: 30 },
  letterTile: { width: TILE_SIZE, height: TILE_SIZE, backgroundColor: '#0f3460', borderRadius: 15, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  selectedTile: { backgroundColor: '#4ecca3', transform: [{ scale: 0.95 }] },
  letterText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  selectedText: { color: '#1a1a2e' },
  orderBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#1a1a2e', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  orderText: { color: '#4ecca3', fontSize: 14, fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 20, marginBottom: 25 },
  clearButton: { backgroundColor: '#e94560', paddingHorizontal: 35, paddingVertical: 15, borderRadius: 25 },
  submitButton: { backgroundColor: '#4ecca3', paddingHorizontal: 35, paddingVertical: 15, borderRadius: 25 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  foundWordsContainer: { flex: 1, width: '100%', paddingHorizontal: 20 },
  foundWordsTitle: { fontSize: 16, color: '#888', marginBottom: 10 },
  foundWordsScroll: { flex: 1 },
  foundWordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foundWordBadge: { backgroundColor: '#16213e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  foundWordText: { color: '#4ecca3', fontSize: 14, fontWeight: '600' },
});