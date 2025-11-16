/**
 * Email Validation Service
 * Provides comprehensive email validation including:
 * - Disposable email detection
 * - Pattern-based suspicious email detection
 * - Format validation
 */

// Comprehensive list of disposable email domains (from GitHub disposable list)
const DISPOSABLE_EMAIL_DOMAINS = [
  // Popular disposable email services
  '0-mail.com', '0815.ru', '0clickemail.com', '0wnd.net', '0wnd.org',
  '10mail.org', '10minutemail.com', '10minutemail.net', '10minutemail.org',
  '123-m.com', '1fsdfdsfsdf.tk', '1pad.de', '20mail.it', '21cn.com',
  '2fdgdfgdfgdf.tk', '2prong.com', '30minutemail.com', '33mail.com',
  '3d-painting.com', '4warding.com', '5mail.cf', '5mail.ga', '60minutemail.com',
  '675hosting.com', '675hosting.net', '675hosting.org', '6url.com',
  '75hosting.com', '75hosting.net', '75hosting.org', '7tags.com',
  '9mail.cf', '9ox.net', 'a-bc.net', 'agedmail.com', 'ama-trade.de',
  'amilegit.com', 'amiri.net', 'amiriindustries.com', 'anonbox.net',
  'anonymbox.com', 'antichef.com', 'antichef.net', 'antireg.ru',
  'antispam.de', 'antispammail.de', 'armyspy.com', 'artman-conception.com',
  'azmeil.tk', 'baxomale.ht.cx', 'beefmilk.com', 'bigstring.com',
  'binkmail.com', 'bio-muesli.net', 'bobmail.info', 'bodhi.lawlita.com',
  'bofthew.com', 'bootybay.de', 'boun.cr', 'bouncr.com',
  'breakthru.com', 'brefmail.com', 'brennendesreich.de', 'broadbandninja.com',
  'bsnow.net', 'bspamfree.org', 'bugmenot.com', 'bund.us',
  'burstmail.info', 'buymoreplays.com', 'byom.de', 'c2.hu',
  'card.zp.ua', 'casualdx.com', 'cek.pm', 'centermail.com',
  'centermail.net', 'chacuo.net', 'chielo.com', 'chithinh.com',
  'chogmail.com', 'choicemail1.com', 'clixser.com', 'cmail.net',
  'cmail.org', 'coldemail.info', 'cool.fr.nf', 'courriel.fr.nf',
  'courrieltemporaire.com', 'crapmail.org', 'cust.in', 'cuvox.de',
  'd3p.dk', 'dacoolest.com', 'dandikmail.com', 'dayrep.com',
  'dcemail.com', 'deadaddress.com', 'deadspam.com', 'delikkt.de',
  'despam.it', 'despammed.com', 'devnullmail.com', 'dfgh.net',
  'digitalsanctuary.com', 'dingbone.com', 'disbox.net', 'disbox.org',
  'discard.cf', 'discard.email', 'discard.ga', 'discard.gq',
  'discard.ml', 'discard.tk', 'discardmail.com', 'discardmail.de',
  'disposable-email.ml', 'disposable.cf', 'disposable.ml', 'disposableaddress.com',
  'disposableemailaddresses.com', 'disposableinbox.com', 'dispose.it', 'disposeamail.com',
  'disposemail.com', 'dispostable.com', 'divermail.com', 'dm.w3internet.co.uk',
  'dodgeit.com', 'dodgit.com', 'dodgit.org', 'donemail.ru',
  'dontreg.com', 'dontsendmespam.de', 'drdrb.com', 'drdrb.net',
  'dump-email.info', 'dumpandjunk.com', 'dumpmail.de', 'dumpyemail.com',
  'e-mail.com', 'e-mail.org', 'e4ward.com', 'easytrashmail.com',
  'einmalmail.de', 'einrot.com', 'einrot.de', 'eintagsmail.de',
  'email-fake.cf', 'email-fake.com', 'email-fake.ga', 'email-fake.gq',
  'email-fake.ml', 'email-fake.tk', 'email60.com', 'emaildienst.de',
  'emailgo.de', 'emailias.com', 'emaillime.com', 'emailresort.com',
  'emailsensei.com', 'emailtemporanea.com', 'emailtemporanea.net', 'emailtemporar.ro',
  'emailtemporario.com.br', 'emailthe.net', 'emailtmp.com', 'emailto.de',
  'emailure.net', 'emailwarden.com', 'emailx.at.hm', 'emailxfer.com',
  'emeil.in', 'emeil.ir', 'emz.net', 'ephemail.net',
  'etranquil.com', 'etranquil.net', 'etranquil.org', 'evopo.com',
  'explodemail.com', 'express.net.ua', 'extremail.ru', 'eyepaste.com',
  'fakebox.org', 'fakeinbox.com', 'fakeinformation.com', 'fakemail.fr',
  'fakemailgenerator.com', 'fakemailz.com', 'fammix.com', 'fansworldwide.de',
  'fantasymail.de', 'fastacura.com', 'fastchevy.com', 'fastchrysler.com',
  'fastkawasaki.com', 'fastmazda.com', 'fastmitsubishi.com', 'fastnissan.com',
  'fastsubaru.com', 'fastsuzuki.com', 'fasttoyota.com', 'fastyamaha.com',
  'fightallspam.com', 'filzmail.com', 'fir.hk', 'firemail.cc',
  'fivemail.de', 'fixmail.tk', 'fizmail.com', 'fleckens.hu',
  'frapmail.com', 'free-email.cf', 'free-email.ga', 'freemail.ms',
  'freemails.cf', 'freemails.ga', 'freemails.ml', 'freundin.ru',
  'friendlymail.co.uk', 'fuckingduh.com', 'fudgerub.com', 'fux0ringduh.com',
  'fyii.de', 'garbagemail.org', 'garliclife.com', 'gehensiemirnichtaufdensack.de',
  'get.pp.ua', 'get1mail.com', 'get2mail.fr', 'getairmail.cf',
  'getairmail.com', 'getairmail.ga', 'getairmail.gq', 'getairmail.ml',
  'getairmail.tk', 'getmails.eu', 'getonemail.com', 'getonemail.net',
  'ghosttexter.de', 'giantmail.de', 'girlsundertheinfluence.com', 'gishpuppy.com',
  'gmx.net', 'goemailgo.com', 'gotmail.com', 'gotmail.net',
  'gotmail.org', 'gotti.otherinbox.com', 'great-host.in', 'greensloth.com',
  'grr.la', 'gsrv.co.uk', 'guerillamail.biz', 'guerillamail.com',
  'guerillamail.de', 'guerillamail.info', 'guerillamail.net', 'guerillamail.org',
  'guerrillamail.biz', 'guerrillamail.com', 'guerrillamail.de', 'guerrillamail.info',
  'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com', 'gustr.com',
  'h.mintemail.com', 'h8s.org', 'haltospam.com', 'harakirimail.com',
  'hat-geld.de', 'hatespam.org', 'herp.in', 'hidemail.de',
  'hidzz.com', 'hmamail.com', 'hopemail.biz', 'hotpop.com',
  'hulapla.de', 'ieatspam.eu', 'ieatspam.info', 'ieh-mail.de',
  'ihateyoualot.info', 'iheartspam.org', 'ikbenspamvrij.nl', 'imails.info',
  'inbax.tk', 'inbox.si', 'inboxalias.com', 'inboxclean.com',
  'inboxclean.org', 'infocom.zp.ua', 'instant-mail.de', 'instantemailaddress.com',
  'ipoo.org', 'irish2me.com', 'iwi.net', 'jetable.com',
  'jetable.fr.nf', 'jetable.net', 'jetable.org', 'jmail.ro',
  'jnxjn.com', 'jourrapide.com', 'jsrsolutions.com', 'junk1e.com',
  'junkmail.ga', 'junkmail.gq', 'kasmail.com', 'kaspop.com',
  'keepmymail.com', 'killmail.com', 'killmail.net', 'kir.ch.tc',
  'klassmaster.com', 'klzlk.com', 'koszmail.pl', 'krunis.com',
  'kurzepost.de', 'kwift.net', 'l33r.eu', 'labetteraverouge.at',
  'lags.us', 'landmail.co', 'lastmail.co', 'lavabit.com',
  'letthemeatspam.com', 'lhsdv.com', 'lifebyfood.com', 'link2mail.net',
  'litedrop.com', 'lol.ovpn.to', 'lolfreak.net', 'lookugly.com',
  'lopl.co.cc', 'lortemail.dk', 'lr78.com', 'lroid.com',
  'lukop.dk', 'm21.cc', 'mail-easy.fr', 'mail-filter.com',
  'mail-temporaire.fr', 'mail.by', 'mail.mezimages.net', 'mail.zp.ua',
  'mail1a.de', 'mail21.cc', 'mail2rss.org', 'mail333.com',
  'mail4trash.com', 'mailbidon.com', 'mailblocks.com', 'mailbucket.org',
  'mailcatch.com', 'maildrop.cc', 'maildrop.cf', 'maildrop.ga',
  'maildrop.gq', 'maildrop.ml', 'maileater.com', 'mailed.in',
  'mailed.ro', 'maileimer.de', 'mailexpire.com', 'mailfa.tk',
  'mailforspam.com', 'mailfree.ga', 'mailfree.gq', 'mailfree.ml',
  'mailfreeonline.com', 'mailguard.me', 'mailimate.com', 'mailin8r.com',
  'mailinater.com', 'mailinator.com', 'mailinator.info', 'mailinator.net',
  'mailinator.org', 'mailinator.us', 'mailinator2.com', 'mailincubator.com',
  'mailismagic.com', 'mailmate.com', 'mailme.ir', 'mailme.lv',
  'mailme24.com', 'mailmetrash.com', 'mailmoat.com', 'mailms.com',
  'mailnator.com', 'mailnesia.com', 'mailnull.com', 'mailorg.org',
  'mailpick.biz', 'mailproxsy.com', 'mailquack.com', 'mailrock.biz',
  'mailscrap.com', 'mailseal.de', 'mailshell.com', 'mailsiphon.com',
  'mailslapping.com', 'mailslite.com', 'mailtemp.info', 'mailtome.de',
  'mailtothis.com', 'mailtrash.net', 'mailtv.net', 'mailtv.tv',
  'mailzilla.com', 'mailzilla.org', 'makemetheking.com', 'manybrain.com',
  'mbx.cc', 'mega.zik.dj', 'meinspamschutz.de', 'meltmail.com',
  'messagebeamer.de', 'mezimages.net', 'ministry-of-silly-walks.de', 'mintemail.com',
  'misterpinball.de', 'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
  'monumentmail.com', 'mt2009.com', 'mt2014.com', 'mt2015.com',
  'mycard.net.ua', 'mycleaninbox.net', 'mymail-in.net', 'mypacks.net',
  'mypartyclip.de', 'myphantomemail.com', 'mysamp.de', 'mytempemail.com',
  'mytempmail.com', 'mytrashmail.com', 'nabuma.com', 'neomailbox.com',
  'nepwk.com', 'nervmich.net', 'nervtmich.net', 'netmails.com',
  'netmails.net', 'netzidiot.de', 'neverbox.com', 'nice-4u.com',
  'nincsmail.com', 'nincsmail.hu', 'nnh.com', 'no-spam.ws',
  'noblepioneer.com', 'nomail.pw', 'nomail.xl.cx', 'nomail2me.com',
  'nomorespamemails.com', 'nonspam.eu', 'nonspammer.de', 'noref.in',
  'nospam.ze.tc', 'nospam4.us', 'nospamfor.us', 'nospammail.net',
  'notmailinator.com', 'nowhere.org', 'nowmymail.com', 'nurfuerspam.de',
  'nus.edu.sg', 'nwldx.com', 'objectmail.com', 'obobbo.com',
  'odnorazovoe.ru', 'oneoffemail.com', 'onewaymail.com', 'onlatedotcom.info',
  'online.ms', 'oopi.org', 'opayq.com', 'ordinaryamerican.net',
  'otherinbox.com', 'ourklips.com', 'outlawspam.com', 'ovpn.to',
  'owlpic.com', 'pancakemail.com', 'paplease.com', 'pastebitch.com',
  'pcusers.otherinbox.com', 'pimpedupmyspace.com', 'pjjkp.com', 'plexolan.de',
  'poczta.onet.pl', 'politikerclub.de', 'poofy.org', 'pookmail.com',
  'postacin.com', 'privacy.net', 'privatdemail.net', 'proxymail.eu',
  'prtnx.com', 'putthisinyourspamdatabase.com', 'pwrby.com', 'quickinbox.com',
  'quickmail.nl', 'radiku.ye.vc', 'rcpt.at', 'reallymymail.com',
  'realtyalerts.ca', 'recode.me', 'recursor.net', 'reliable-mail.com',
  'rhyta.com', 'rmqkr.net', 'royal.net', 'rtrtr.com',
  's0ny.net', 'safe-mail.net', 'safersignup.de', 'safetymail.info',
  'safetypost.de', 'sandelf.de', 'saynotospams.com', 'schafmail.de',
  'schrott-email.de', 'secretemail.de', 'secure-mail.biz', 'secure-mail.cc',
  'selfdestructingmail.com', 'sendspamhere.com', 'senseless-entertainment.com', 'services391.com',
  'sharklasers.com', 'shieldemail.com', 'shiftmail.com', 'shitmail.me',
  'shitmail.org', 'shitware.nl', 'shmeriously.com', 'shortmail.net',
  'sibmail.com', 'sify.com', 'skeefmail.com', 'slaskpost.se',
  'slipry.net', 'slopsbox.com', 'smashmail.de', 'smellfear.com',
  'snakemail.com', 'sneakemail.com', 'sneakmail.de', 'snkmail.com',
  'sofimail.com', 'sofort-mail.de', 'sofortmail.de', 'softpls.asia',
  'solvemail.info', 'sogetthis.com', 'soodonims.com', 'spam.la',
  'spam.su', 'spam4.me', 'spamavert.com', 'spambob.com',
  'spambob.net', 'spambob.org', 'spambog.com', 'spambog.de',
  'spambog.ru', 'spambooger.com', 'spambox.info', 'spambox.irishspringrealty.com',
  'spambox.us', 'spamcannon.com', 'spamcannon.net', 'spamcero.com',
  'spamcon.org', 'spamcorptastic.com', 'spamcowboy.com', 'spamcowboy.net',
  'spamcowboy.org', 'spamday.com', 'spamex.com', 'spamfree.eu',
  'spamfree24.com', 'spamfree24.de', 'spamfree24.eu', 'spamfree24.info',
  'spamfree24.net', 'spamfree24.org', 'spamgoes.in', 'spamgourmet.com',
  'spamgourmet.net', 'spamgourmet.org', 'spamherelots.com', 'spamhereplease.com',
  'spamhole.com', 'spamify.com', 'spaminator.de', 'spamkill.info',
  'spaml.com', 'spaml.de', 'spammotel.com', 'spamobox.com',
  'spamoff.de', 'spamslicer.com', 'spamspot.com', 'spamstack.net',
  'spamthis.co.uk', 'spamthisplease.com', 'spamtrail.com', 'speed.1s.fr',
  'spoofmail.de', 'stuffmail.de', 'super-auswahl.de', 'supergreatmail.com',
  'supermailer.jp', 'superrito.com', 'superstachel.de', 'suremail.info',
  'sweetxxx.de', 'talkinator.com', 'teewars.org', 'teleworm.com',
  'teleworm.us', 'temp-mail.de', 'temp-mail.org', 'temp-mail.ru',
  'temp.emeraldwebmail.com', 'tempe-mail.com', 'tempemail.biz', 'tempemail.co.za',
  'tempemail.com', 'tempemail.net', 'tempinbox.co.uk', 'tempinbox.com',
  'tempmail.co', 'tempmail.de', 'tempmail.eu', 'tempmail.it',
  'tempmail2.com', 'tempmaildemo.com', 'tempmailer.com', 'tempmailer.de',
  'tempomail.fr', 'temporarily.de', 'temporarioemail.com.br', 'temporaryemail.net',
  'temporaryemail.us', 'temporaryforwarding.com', 'temporaryinbox.com', 'temporarymailaddress.com',
  'tempthe.net', 'tempymail.com', 'thanksnospam.info', 'thankyou2010.com',
  'thc.st', 'thelimestones.com', 'thisisnotmyrealemail.com', 'thismail.net',
  'throwam.com', 'throwawayemailaddress.com', 'throwawaymail.com', 'tilien.com',
  'tittbit.in', 'tizi.com', 'tmailinator.com', 'toomail.biz',
  'topranklist.de', 'tormail.org', 'tradermail.info', 'trash-amil.com',
  'trash-mail.at', 'trash-mail.cf', 'trash-mail.com', 'trash-mail.de',
  'trash-mail.ga', 'trash-mail.gq', 'trash-mail.ml', 'trash-mail.tk',
  'trash2009.com', 'trash2010.com', 'trash2011.com', 'trashbox.eu',
  'trashcanmail.com', 'trashdevil.com', 'trashdevil.de', 'trashemail.de',
  'trashemails.de', 'trashmail.at', 'trashmail.com', 'trashmail.de',
  'trashmail.me', 'trashmail.net', 'trashmail.org', 'trashmail.ws',
  'trashmailer.com', 'trashymail.com', 'trashymail.net', 'trialmail.de',
  'trillianpro.com', 'twinmail.de', 'tyldd.com', 'uggsrock.com',
  'umail.net', 'upliftnow.com', 'uplipht.com', 'uroid.com',
  'us.af', 'venompen.com', 'veryrealemail.com', 'viditag.com',
  'viralplays.com', 'vpn.st', 'vsimcard.com', 'vubby.com',
  'wasteland.rfc822.org', 'watch-harry-potter.com', 'watchfull.net', 'webemail.me',
  'weg-werf-email.de', 'wegwerf-email-addressen.de', 'wegwerf-emails.de', 'wegwerfadresse.de',
  'wegwerfemail.com', 'wegwerfemail.de', 'wegwerfemail.net', 'wegwerfemail.org',
  'wegwerfemailadresse.com', 'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  'wetrainbayarea.com', 'wetrainbayarea.org', 'wh4f.org', 'whatiaas.com',
  'whatpaas.com', 'whiffles.org', 'whyspam.me', 'willhackforfood.biz',
  'willselfdestruct.com', 'winemaven.info', 'wronghead.com', 'wuzup.net',
  'wuzupmail.net', 'www.e4ward.com', 'www.gishpuppy.com', 'www.mailinator.com',
  'wwwnew.eu', 'x.ip6.li', 'xagloo.com', 'xemaps.com',
  'xents.com', 'xmaily.com', 'xoxy.net', 'yapped.net',
  'yep.it', 'yogamaven.com', 'yopmail.com', 'yopmail.fr',
  'yopmail.net', 'yopmail.pp.ua', 'you-spam.com', 'yuurok.com',
  'z1p.biz', 'za.com', 'zehnminuten.de', 'zehnminutenmail.de',
  'zetmail.com', 'zippymail.info', 'zoaxe.com', 'zoemail.com',
  'zomg.info', 'zxcv.com', 'zxcvbnm.com', 'zzz.com'
];

// Suspicious email patterns
const SUSPICIOUS_PATTERNS = [
  /temp.*mail/i,
  /temporary.*mail/i,
  /throw.*away/i,
  /disposable/i,
  /guerrilla/i,
  /10minute/i,
  /mailinator/i,
  /discard/i,
  /fake.*mail/i,
  /trash.*mail/i,
  /burner.*mail/i,
  /spam/i,
  /junk/i,
  /dump/i,
  /nospam/i,
  /guerilla/i,
  /minute.*mail/i,
  /hour.*mail/i,
  /instant.*mail/i,
  /quick.*mail/i,
];

// Valid email format regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export interface EmailValidationResult {
  isValid: boolean;
  isDisposable: boolean;
  isSuspicious: boolean;
  reason?: string;
}

/**
 * Validates email format
 */
export function isValidEmailFormat(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Checks if email domain is in disposable list
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) return false;
  
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Checks if email matches suspicious patterns
 * Note: Only checks domain part to avoid false positives on username
 */
export function hasSuspiciousPattern(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  
  // Check patterns against domain only (not the full email)
  // This prevents false positives like "minutes2energy@gmail.com"
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(domain));
}

/**
 * Comprehensive email validation
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  // Check format
  if (!isValidEmailFormat(email)) {
    return {
      isValid: false,
      isDisposable: false,
      isSuspicious: false,
      reason: 'Invalid email format'
    };
  }

  // IMPORTANT: Check if from trusted domain FIRST (bypass all other checks)
  if (isTrustedDomain(email)) {
    return {
      isValid: true,
      isDisposable: false,
      isSuspicious: false
    };
  }

  // Check if disposable
  const isDisposable = isDisposableEmail(email);
  if (isDisposable) {
    return {
      isValid: false,
      isDisposable: true,
      isSuspicious: false,
      reason: 'Disposable email addresses are not allowed'
    };
  }

  // Check suspicious patterns (only for non-trusted domains)
  const isSuspicious = hasSuspiciousPattern(email);
  if (isSuspicious) {
    return {
      isValid: false,
      isDisposable: false,
      isSuspicious: true,
      reason: 'This email address appears to be temporary or suspicious'
    };
  }

  // All checks passed
  return {
    isValid: true,
    isDisposable: false,
    isSuspicious: false
  };
}

/**
 * Get email domain
 */
export function getEmailDomain(email: string): string | null {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

/**
 * Check if email is from a trusted domain
 */
export function isTrustedDomain(email: string): boolean {
  const trustedDomains = [
    // Google
    'gmail.com',
    'googlemail.com',
    
    // Microsoft
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    
    // Apple
    'icloud.com',
    'me.com',
    'mac.com',
    
    // Yahoo
    'yahoo.com',
    'yahoo.co.uk',
    'yahoo.in',
    'ymail.com',
    
    // Other Major Providers
    'protonmail.com',
    'proton.me',
    'aol.com',
    'zoho.com',
    'mail.com',
    'gmx.com',
    'gmx.net',
    'fastmail.com',
    'tutanota.com',
    'mailfence.com',
    
    // Business/Enterprise
    'mail.ru',
    'yandex.com',
    'qq.com',
    '163.com',
    '126.com',
    
    // Regional Popular
    'rediffmail.com',
    'inbox.com',
    'bigpond.com',
    'att.net',
    'sbcglobal.net',
    'verizon.net',
    'comcast.net'
  ];

  const domain = getEmailDomain(email);
  return domain ? trustedDomains.includes(domain) : false;
}

