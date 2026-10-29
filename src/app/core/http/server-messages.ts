import { I18nService, TranslationParams } from '../i18n/i18n.service';

type StatusGroup = 'sessionStatus' | 'minutesStatus' | 'requestStatus';

interface Pattern {
  re: RegExp;
  key: string;
  params: (match: RegExpMatchArray, i18n: I18nService) => TranslationParams;
}

/** Fixed English (and a few Spanish) texts returned by the API. The screen language wins. */
const EXACT: Record<string, string> = {
  'Minutes already exist for this session': 'errors.server.minutesExist',
  'Incomplete information: there are items not yet closed': 'errors.server.minutesIncomplete',
  'The minutes content is not valid XHTML': 'errors.server.minutesXhtml',
  'The minutes are already published: view them in the Digital Repository': 'errors.server.minutesPublished',
  'Minutes not found': 'errors.server.minutesNotFound',
  'Your user is not linked to a Faculty': 'errors.server.noFaculty',
  'Only the user who filed the request can modify it': 'errors.server.requestOwnerOnly',
  'El programa no pertenece a la facultad de la radicación': 'errors.server.programFilingFaculty',
  'The attachment was altered: its SHA-256 fingerprint does not match the recorded one': 'errors.server.attachmentAltered',
  'Only documents in PDF format are allowed': 'errors.server.pdfOnly',
  'Could not process the attached files': 'errors.server.attachmentsFailed',
  'You can only file requests for your program': 'errors.server.ownProgramOnly',
  'The Program does not belong to your Faculty': 'errors.server.programNotYours',
  'You can only view the requests you filed': 'errors.server.viewOwnRequests',
  'You can only view the requests of your program': 'errors.server.viewProgramRequests',
  'Request not found': 'errors.server.requestNotFound',
  'Attachment not found': 'errors.server.attachmentNotFound',
  'This council type is no longer in use': 'errors.server.councilTypeRetired',
  'The request belongs to another Faculty': 'errors.server.requestOtherFaculty',
  'Urgent items can only be added to an Extraordinary Council session': 'errors.server.urgentExtraordinary',
  'You must send exactly the agenda items, without repetitions': 'errors.server.agendaExact',
  'Guests can only be invited to an Expanded Council session': 'errors.server.guestsExpanded',
  'The guest does not belong to this session': 'errors.server.guestMissing',
  'The agenda has no items: add at least one approved request or urgent item': 'errors.server.agendaEmpty',
  'The notice has not been issued yet: the agenda is not closed': 'errors.server.noticeNotIssued',
  'Session not found': 'errors.server.sessionNotFound',
  'The agenda has already been closed and published; it cannot be modified (RN-09)': 'errors.server.agendaClosed',
  'The item does not belong to this session': 'errors.server.itemMissing',
  'Summon at least one voting member: the president or a counselor': 'errors.server.summonVoter',
  'Only a SUSPENDED session can be resumed': 'errors.server.resumeSuspended',
  'There are items without a recorded decision; the session cannot be finished': 'errors.server.openDecisions',
  'Para modificar la decisión indique el motivo del cambio': 'errors.server.decisionReason',
  'The note does not contain valid text': 'errors.server.noteEmpty',
  'Para aprobar, los votos a favor tienen que ser más que los en contra': 'errors.server.approveMajority',
  'Para negar, los votos en contra tienen que ser más que los a favor': 'errors.server.denyMajority',
  'Select the Faculty of the agreement': 'errors.server.agreementFaculty',
  'Agreement not found': 'errors.server.agreementNotFound',
  'Invalid agreement content': 'errors.server.agreementContent',
  'Invalid or expired session': 'errors.server.sessionExpired',
  'You do not have permissions on resources of another Faculty': 'errors.server.otherFaculty',
  'No logo has been uploaded': 'errors.server.noLogo',
  'Select an image': 'errors.server.selectImage',
  'The image cannot exceed 5 MB': 'errors.server.imageTooLarge',
  'Only PNG or JPG images are allowed': 'errors.server.imageType',
  'The file is not a valid image': 'errors.server.imageInvalid',
  'A university with that name already exists': 'errors.server.universityExists',
  'University not found': 'errors.server.universityNotFound',
  'No se puede eliminar: esta universidad tiene sedes. Elimine primero lo que depende de ella.': 'errors.server.universityHasCampuses',
  'Campus not found': 'errors.server.campusNotFound',
  'No se puede eliminar: esta sede tiene facultades. Elimine primero lo que depende de ella.': 'errors.server.campusHasFaculties',
  'Faculty not found': 'errors.server.facultyNotFound',
  'No se puede eliminar: esta facultad tiene programas, usuarios o trámites del consejo.': 'errors.server.facultyInUse',
  'Program not found': 'errors.server.programNotFound',
  'No se puede eliminar: hay personas o solicitudes en este programa.': 'errors.server.programInUse',
  'A user with that email is already registered': 'errors.server.emailTaken',
  'You cannot deactivate your own account': 'errors.server.selfDeactivate',
  'The current password is incorrect': 'errors.server.currentPassword',
  'The password must be at least 8 characters long and include letters and numbers': 'errors.passwordPolicy',
  'RN-01: operational roles require a Faculty': 'errors.server.roleNeedsFaculty',
  'The Program does not belong to the given Faculty': 'errors.server.programFaculty',
  'User not found': 'errors.server.userNotFound',
  'Council type not found': 'errors.server.councilTypeNotFound',
  'The template could not be processed with the supplied data': 'errors.server.templateProcess',
  'Could not generate the PDF/A from the content': 'errors.server.pdfFailed',
  'Compromised document: the file could not be found in storage': 'errors.server.compromisedMissing',
  'Compromised document: the SHA-256 fingerprint does not match the one recorded at signing. The download was blocked and administrators were notified': 'errors.server.compromisedHash',
  'Only PUBLISHED minutes are available in the repository': 'errors.server.repoPublishedOnly',
  'You can only access the minutes of the sessions you attended': 'errors.server.attendedOnly',
  'Password updated successfully': 'reset.passwordUpdated',
  'If the email is registered, you will receive instructions to reset your password': 'forgot.sent',
  'The recovery link is invalid or has already been used': 'reset.invalidLink',
  'Incorrect sign-in credentials': 'errors.server.badCredentials',
  'User account deactivated. Please contact the administration': 'errors.server.accountDisabled',
  'The template contains errors and cannot be used': 'errors.server.templateErrors',
  'There is no active template for this council type. Ask an administrator to publish one': 'errors.server.noTemplate',
  'Template not found': 'errors.server.templateNotFound',
  'The value must be an integer': 'errors.server.integerRequired',
  'Invalid input data': 'errors.server.invalidInput',
  'Request body is unreadable or malformed': 'errors.server.badBody',
  'The document exceeds the maximum allowed size': 'errors.server.uploadTooLarge',
  'You do not have permission to perform this operation': 'errors.forbidden',
  'The operation violates an integrity constraint (duplicate or referenced record)': 'errors.server.integrity',
  'Resource not found': 'errors.server.notFound',
  'HTTP method not allowed for this resource': 'errors.server.methodNotAllowed',
  'Internal server error': 'errors.server.internal',
  'th:utext is only allowed for the notes field of an agreement (e.g. ${ag.notes})': 'errors.server.utextNotes',
  'Unescaped inlining [( ... )] is not allowed; use [[${variable}]]': 'errors.server.noInlining',
  'The template must include ${serialNumber} and iterate ${agreements}': 'errors.server.templateRequired',
  'The content cannot be empty': 'errors.server.contentEmpty',
  '<meta http-equiv> is not allowed': 'errors.server.metaForbidden',
  'Only embedded images (data:image/...;base64) are allowed. Source not allowed in <img>': 'errors.server.embeddedImages',
  'CSS with external resources (@import / url(...)) is not allowed; use a data: URI': 'errors.server.cssExternal',
  'must not be blank': 'errors.server.notBlank',
  'must not be null': 'errors.server.notNull',
  'must not be empty': 'errors.server.notEmpty',
  'must be a well-formed email address': 'errors.server.email',
  'must be a future date': 'errors.server.futureDate',
  'no debe estar vacío': 'errors.server.notBlank',
  'no debe ser nulo': 'errors.server.notNull',
  'debe ser una dirección de correo electrónico con formato correcto': 'errors.server.email',
  'tiene que ser una fecha en el futuro': 'errors.server.futureDate',
};

const PATTERNS: Pattern[] = [
  {
    re: /^Attendance cannot be recorded with the session in status (\w+)$/,
    key: 'errors.attendanceClosed',
    params: (m, i18n) => ({ status: lower(statusLabel(i18n, m[1], 'sessionStatus')) }),
  },
  {
    re: /^Minutes can only be generated when the session is FINISHED \(current status: (\w+)\)$/,
    key: 'errors.server.minutesNeedFinished',
    params: (m, i18n) => ({ status: statusLabel(i18n, m[1], 'sessionStatus') }),
  },
  {
    re: /^The minutes cannot be modified in status (\w+) \(RN-17: frozen minutes\)$/,
    key: 'errors.server.minutesFrozen',
    params: (m, i18n) => ({ status: statusLabel(i18n, m[1], 'minutesStatus') }),
  },
  {
    re: /^The minutes cannot be modified in status (\w+)$/,
    key: 'errors.server.minutesLocked',
    params: (m, i18n) => ({ status: statusLabel(i18n, m[1], 'minutesStatus') }),
  },
  {
    re: /^Operation only valid for minutes in status (\w+) \(current: (\w+)\)$/,
    key: 'errors.server.minutesWrongStatus',
    params: (m, i18n) => ({
      expected: statusLabel(i18n, m[1], 'minutesStatus'),
      status: statusLabel(i18n, m[2], 'minutesStatus'),
    }),
  },
  {
    re: /^The request cannot be modified in status (\w+)$/,
    key: 'errors.server.requestLocked',
    params: (m, i18n) => ({ status: statusLabel(i18n, m[1], 'requestStatus') }),
  },
  {
    re: /^The document '(.+)' exceeds the maximum limit of (\d+) MB$/,
    key: 'errors.server.fileTooLarge',
    params: (m) => ({ name: m[1], max: m[2] }),
  },
  {
    re: /^The file '(.+)' is not a valid PDF$/,
    key: 'errors.server.fileNotPdf',
    params: (m) => ({ name: m[1] }),
  },
  {
    re: /^Could not read the file '(.+)'$/,
    key: 'errors.server.fileUnreadable',
    params: (m) => ({ name: m[1] }),
  },
  {
    re: /^Only FILED requests can be reviewed \(current status: (\w+)\)$/,
    key: 'errors.server.reviewFiledOnly',
    params: (m, i18n) => ({ status: statusLabel(i18n, m[1], 'requestStatus') }),
  },
  {
    re: /^The location is required for a session of type (.+)$/,
    key: 'errors.server.locationRequired',
    params: (m) => ({ type: m[1] }),
  },
  {
    re: /^Only APPROVED requests can be added \(current status: (\w+)\)$/,
    key: 'errors.server.approvedOnly',
    params: (m, i18n) => ({ status: statusLabel(i18n, m[1], 'requestStatus') }),
  },
  {
    re: /^User (\d+) cannot be summoned to this council$/,
    key: 'errors.server.summonDenied',
    params: (m) => ({ id: m[1] }),
  },
  {
    re: /^User (\d+) is not a voting member of this Council$/,
    key: 'errors.server.notVoter',
    params: (m) => ({ id: m[1] }),
  },
  {
    re: /^No deliberative quorum: (\d+) members must be present and there are (\d+)$/,
    key: 'errors.server.quorum',
    params: (m) => ({ required: m[1], present: m[2] }),
  },
  {
    re: /^Los votos no pueden superar a los (\d+) presentes con voto$/,
    key: 'errors.server.tooManyVotes',
    params: (m) => ({ count: m[1] }),
  },
  {
    re: /^Decisions can only be recorded while the session is STARTED \(current status: (\w+)\)$/,
    key: 'errors.server.decisionsWhileStarted',
    params: (m, i18n) => ({ status: statusLabel(i18n, m[1], 'sessionStatus') }),
  },
  {
    re: /^Debate notes can only be recorded while the session is STARTED \(current status: (\w+)\)$/,
    key: 'errors.server.notesWhileStarted',
    params: (m, i18n) => ({ status: statusLabel(i18n, m[1], 'sessionStatus') }),
  },
  {
    re: /^Miscellaneous items can only be created while the session is STARTED \(current status: (\w+)\)$/,
    key: 'errors.server.miscWhileStarted',
    params: (m, i18n) => ({ status: statusLabel(i18n, m[1], 'sessionStatus') }),
  },
  {
    re: /^Transition not allowed: (\w+) → (\w+)$/,
    key: 'errors.server.transitionDenied',
    params: (m, i18n) => ({
      from: statusLabel(i18n, m[1], 'sessionStatus'),
      to: statusLabel(i18n, m[2], 'sessionStatus'),
    }),
  },
  {
    re: /^Agreement No\. (\d+) of (\d+) already exists in this Faculty$/,
    key: 'errors.server.agreementExists',
    params: (m) => ({ number: m[1], year: m[2] }),
  },
  {
    re: /^Unknown agreement type: (.+)$/,
    key: 'errors.server.agreementType',
    params: (m) => ({ code: m[1] }),
  },
  {
    re: /^Value out of range for (.+)$/,
    key: 'errors.server.valueOutOfRange',
    params: (m) => ({ key: m[1] }),
  },
  {
    re: /^Parameter not found: (.+)$/,
    key: 'errors.server.parameterNotFound',
    params: (m) => ({ key: m[1] }),
  },
  {
    re: /^Invalid request: .+$/,
    key: 'errors.server.badRequest',
    params: () => ({}),
  },
  {
    re: /^th:each with invalid syntax: (.+)$/,
    key: 'errors.server.eachSyntax',
    params: (m) => ({ value: m[1] }),
  },
  {
    re: /^Thymeleaf attribute not allowed: (.+) \(allowed: .+\)$/,
    key: 'errors.server.attrNotAllowed',
    params: (m) => ({ name: m[1] }),
  },
  {
    re: /^Expression not allowed in (.+): only \$\{variable\} expressions are supported$/,
    key: 'errors.server.exprInAttr',
    params: (m) => ({ name: m[1] }),
  },
  {
    re: /^Expression not allowed: \$\{(.+)\} \(only catalog variables or properties such as \$\{item\.field\}\)$/,
    key: 'errors.server.exprNotAllowed',
    params: (m) => ({ expr: m[1] }),
  },
  {
    re: /^Access not allowed in the expression \$\{(.+)\}$/,
    key: 'errors.server.accessDenied',
    params: (m) => ({ expr: m[1] }),
  },
  {
    re: /^Unknown variable: \$\{(.+)\}\. Use the catalog of standardized variables$/,
    key: 'errors.server.unknownVar',
    params: (m) => ({ name: m[1] }),
  },
  {
    re: /^Element not allowed: <(.+)>$/,
    key: 'errors.server.elementForbidden',
    params: (m) => ({ tag: m[1] }),
  },
  {
    re: /^Attribute not allowed '(.+)' in <(.+)>$/,
    key: 'errors.server.attributeForbidden',
    params: (m) => ({ attr: m[1], tag: m[2] }),
  },
  {
    re: /^Inlining not allowed: \[\[(.+)\]\]$/,
    key: 'errors.server.badInline',
    params: (m) => ({ value: m[1] }),
  },
  {
    re: /^Line (\d+): .+ \(the document must be well-formed XHTML: close every tag and use &#160; instead of &nbsp;\)$/,
    key: 'errors.server.xhtmlLine',
    params: (m) => ({ line: m[1] }),
  },
  {
    re: /^Could not parse the document: .+$/,
    key: 'errors.server.parseFailed',
    params: () => ({}),
  },
  {
    re: /^(?:size must be between|el tamaño debe estar entre) (\d+) (?:and|y) (\d+)$/,
    key: 'errors.server.sizeBetween',
    params: (m) => ({ min: m[1], max: m[2] }),
  },
  {
    re: /^(?:must be greater than or equal to|debe ser mayor que o igual a) (\d+)$/,
    key: 'errors.server.minValue',
    params: (m) => ({ min: m[1] }),
  },
];

/** Turns a fixed server sentence into the language selected on screen. Unknown texts stay unchanged. */
export function translateServerText(message: string, i18n: I18nService): string {
  const text = message.trim();
  const exact = EXACT[text];
  if (exact) {
    return i18n.t(exact);
  }
  for (const pattern of PATTERNS) {
    const match = text.match(pattern.re);
    if (match) {
      return i18n.t(pattern.key, pattern.params(match, i18n));
    }
  }
  const field = text.match(/^([A-Za-z][\w.]*): (.+)$/);
  if (field) {
    const rest = translateServerText(field[2], i18n);
    if (rest !== field[2]) {
      return `${field[1]}: ${rest}`;
    }
  }
  return message;
}

function statusLabel(i18n: I18nService, code: string, group: StatusGroup): string {
  const key = `enums.${group}.${code}`;
  const label = i18n.t(key);
  return label === key ? code : label;
}

function lower(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1);
}
