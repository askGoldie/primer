/**
 * One-shot script: merge SEO translation keys into the 8 non-English
 * locale files. Run with `node scripts/add-seo-translations.mjs`.
 *
 * After this has run once, the script can be deleted — the translations
 * live in the locale files. It is kept committed only as an audit record
 * of which strings were added together.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const I18N_DIR = join(__dirname, '..', 'src', 'lib', 'i18n');

/**
 * SEO translations for each of the 8 non-English locales.
 *
 * Design notes:
 *   - Proper nouns "Primer" and "DavidPM" are kept untranslated (they
 *     are entity names).
 *   - Title length target is ~50–60 characters; some languages expand
 *     and will slightly exceed that — that is acceptable.
 *   - Description target is ~150–160 characters for search snippets.
 *   - Keywords use locale-native terminology where a clear equivalent
 *     exists; where a term is already a loanword in the target market
 *     (e.g. "SaaS", "source code"), the loanword is kept.
 */
const translations = {
	zh: {
		'seo.site.name': 'Primer',
		'seo.site.tagline': '一次构建，永久拥有。',
		'seo.org.name': 'DavidPM',
		'seo.org.description':
			'DavidPM 构建 Primer——一个永久源代码许可的组织健康管理平台，客户在自己的基础设施上自主托管。',
		'seo.product.description':
			'Primer 是一个自托管的绩效管理平台,以一次性永久源代码许可的形式销售。用基于五层级的客观指标评估取代主观的绩效评审。',

		'seo.home.title': '自托管绩效管理平台',
		'seo.home.description':
			'Primer 是一个永久许可的自托管绩效管理平台。一次性支付 5,000 美元,获得完整源代码,无 SaaS,无按席位收费。由 DavidPM 打造。',
		'seo.home.keywords':
			'绩效管理, 自托管, 永久许可, 源代码, 组织健康, OKR, 内在动机, DavidPM, Primer',
		'seo.home.og_title': 'Primer — 一次构建,永久拥有。',
		'seo.home.og_description':
			'自托管的组织健康平台。一次性 5,000 美元永久源代码许可。无 SaaS,无订阅,完全所有权。',

		'seo.problem.title': '为什么绩效管理已失灵',
		'seo.problem.description':
			'命令与控制式管理触顶,95% 的目标项目失败。关于传统绩效管理为何失败——以及什么才真正奏效——的基于研究的分析。',
		'seo.problem.keywords':
			'绩效管理问题, OKR 为何失败, 内在动机, 命令控制失败, 目标设定研究, 自我决定理论',
		'seo.problem.og_title': '为什么绩效管理普遍失灵',
		'seo.problem.og_description':
			'95% 的目标项目失败。命令与控制存在硬性天花板。这是研究,以及替代方案。',

		'seo.how.title': 'Primer 如何运作 — 五层级框架',
		'seo.how.description':
			'Primer 在五个运营层级上评估组织健康:警报、关注、稳定、有效、优化。定义你的指标,设定阈值,追踪真实绩效。',
		'seo.how.keywords':
			'Primer 如何运作, 五层级框架, 警报 关注 稳定 有效 优化, 指标评估, 层级阈值, 组织健康框架',
		'seo.how.og_title': '五层级框架 — 从警报到优化',
		'seo.how.og_description':
			'用客观的分层指标评估取代主观评审。了解 Primer 如何通过可见性实现内在动机。',

		'seo.pricing.title': '定价 — 一次性 5,000 美元永久许可',
		'seo.pricing.description':
			'Primer 一次性 5,000 美元。无订阅,无按席位收费,无经常性费用。获得完整源代码并永久拥有。可在任何 Postgres 提供商上自托管。',
		'seo.pricing.keywords':
			'Primer 定价, 永久许可成本, 一次性软件许可, 无订阅绩效管理, 自托管定价, 源代码购买',
		'seo.pricing.og_title': '5,000 美元一次。永久拥有。',
		'seo.pricing.og_description':
			'永久源代码许可。无 SaaS。无按席位收费。完全拥有你的绩效管理基础设施。',

		'seo.about.title': '关于 DavidPM — Primer 背后的团队',
		'seo.about.description':
			'DavidPM 基于"商业软件的未来是所有权"这一论点打造 Primer。了解团队和永久许可模式背后的原则。',
		'seo.about.keywords':
			'DavidPM, 关于 Primer, 永久许可理念, 软件所有权, 源代码许可, 谁打造 Primer',
		'seo.about.og_title': '关于 DavidPM',
		'seo.about.og_description': '我们相信商业软件的未来是所有权,而非租用。认识打造 Primer 的团队。',

		'seo.faq.title': '常见问题',
		'seo.faq.description':
			'关于 Primer 的常见问题解答:许可、部署、支持、定价、源代码访问、修改,以及购买时你获得什么。',
		'seo.faq.keywords':
			'Primer 常见问题, 永久许可问题, 自托管部署, 源代码许可 FAQ, Primer 支持, 如何部署 Primer',
		'seo.faq.og_title': 'Primer 常见问题 — 许可、部署、支持',
		'seo.faq.og_description': '关于 Primer 如何许可、交付、部署和维护的一切你需要知道的信息。',

		'seo.about_pricing.title': '定价理念 — 为什么一次定价,永久拥有',
		'seo.about_pricing.description':
			'为什么 DavidPM 以一次性永久许可而非订阅方式销售 Primer。商业软件中所有权胜过租用的理由。',
		'seo.about_pricing.keywords':
			'定价理念, 永久许可理由, 所有权对比 SaaS, 一次性许可, 软件所有权理念',
		'seo.about_pricing.og_title': '为什么一次定价,永久拥有',
		'seo.about_pricing.og_description': 'Primer 永久许可模式背后的理由——为什么我们不销售 SaaS。',

		'seo.license.title': '永久源代码许可条款',
		'seo.license.description':
			'Primer 作为永久源代码许可销售。阅读条款:完整源代码访问、修改权、部署自由、无供应商依赖。',
		'seo.license.keywords': '永久许可条款, 源代码许可, 软件所有权, 修改权, 无供应商锁定',
		'seo.license.og_title': '永久源代码许可',
		'seo.license.og_description': '完整源代码,完全修改权,无供应商依赖。阅读许可条款。',

		'seo.security.title': '安全与自托管架构',
		'seo.security.description':
			'Primer 的安全模式:客户控制的数据、源代码透明、购买后无供应商访问。无需供应商谈判即可在 HIPAA、SOC 2 或 ISO 27001 环境中部署。',
		'seo.security.keywords':
			'Primer 安全, 自托管安全, HIPAA 合规绩效管理, 数据驻留, 源代码透明软件, 无供应商后门',
		'seo.security.og_title': '以所有权实现安全',
		'seo.security.og_description':
			'你的数据、你的基础设施、你的源代码。无供应商后门。符合 HIPAA、SOC 2、ISO 27001 环境。',

		'seo.deployment.title': '部署 Primer — 要求与指南',
		'seo.deployment.description':
			'在任何 PostgreSQL 提供商(Neon、Railway、Supabase、自托管)和标准 Node.js 托管上部署 Primer。提供商无关,无专有基础设施要求。',
		'seo.deployment.keywords':
			'部署 Primer, 自托管部署, PostgreSQL 托管, SvelteKit 部署, Node.js 绩效管理, 本地部署',
		'seo.deployment.og_title': '在 Postgres 能运行的任何地方部署 Primer',
		'seo.deployment.og_description':
			'提供商无关的部署。任何 PostgreSQL,任何 Node.js 主机。无供应商锁定。',

		'seo.contact.title': '联系 DavidPM',
		'seo.contact.description':
			'联系 DavidPM 咨询 Primer——购买问题、部署服务或关于永久许可模式的一般咨询。',
		'seo.contact.keywords': '联系 DavidPM, Primer 销售, 部署服务咨询, 永久许可问题',
		'seo.contact.og_title': '联系 DavidPM',
		'seo.contact.og_description': '关于 Primer、购买或部署的问题?请联系。',

		'seo.demo.title': '实时互动演示',
		'seo.demo.description':
			'通过三部分互动演示探索 Primer 的层级框架、指标权重和综合评分。无需注册。',
		'seo.demo.keywords': 'Primer 演示, 互动演示, 层级框架演示, 指标权重演示, 绩效管理演示',
		'seo.demo.og_title': '试用 Primer — 互动演示',
		'seo.demo.og_description': '三部分互动演示 Primer 的层级框架。无需注册。'
	},

	es: {
		'seo.site.name': 'Primer',
		'seo.site.tagline': 'Constrúyelo una vez. Tuyo para siempre.',
		'seo.org.name': 'DavidPM',
		'seo.org.description':
			'DavidPM desarrolla Primer, una plataforma de salud organizacional con licencia perpetua de código fuente que los clientes alojan por sí mismos en su propia infraestructura.',
		'seo.product.description':
			'Primer es una plataforma autoalojada de gestión del desempeño vendida como licencia perpetua de código fuente. Reemplaza las evaluaciones subjetivas con una evaluación objetiva basada en cinco niveles operativos.',

		'seo.home.title': 'Plataforma autoalojada de gestión del desempeño',
		'seo.home.description':
			'Primer es una plataforma autoalojada de gestión del desempeño con licencia perpetua. Compra única de $5,000, código fuente completo, sin SaaS, sin tarifas por usuario. Por DavidPM.',
		'seo.home.keywords':
			'gestión del desempeño, autoalojado, licencia perpetua, código fuente, salud organizacional, OKR, motivación intrínseca, DavidPM, Primer',
		'seo.home.og_title': 'Primer — Constrúyelo una vez. Tuyo para siempre.',
		'seo.home.og_description':
			'Plataforma autoalojada de salud organizacional. Licencia perpetua de código fuente de $5,000 una sola vez. Sin SaaS, sin suscripciones, propiedad total.',

		'seo.problem.title': 'Por qué la gestión del desempeño está rota',
		'seo.problem.description':
			'La gestión de comando y control se estanca, y el 95% de las iniciativas de objetivos fracasan. Análisis respaldado por investigación sobre por qué falla la gestión tradicional — y qué sí funciona.',
		'seo.problem.keywords':
			'problemas gestión desempeño, por qué fallan los OKR, motivación intrínseca, fallo comando y control, investigación objetivos, teoría autodeterminación',
		'seo.problem.og_title': 'Por qué la gestión del desempeño está universalmente rota',
		'seo.problem.og_description':
			'El 95% de las iniciativas de objetivos fracasan. Comando y control tiene un techo duro. Aquí está la investigación, y la alternativa.',

		'seo.how.title': 'Cómo funciona Primer — El marco de cinco niveles',
		'seo.how.description':
			'Primer evalúa la salud organizacional en cinco niveles operativos: Alarma, Preocupación, Contenido, Efectivo, Optimizado. Define tus métricas, establece umbrales y mide el desempeño real.',
		'seo.how.keywords':
			'cómo funciona Primer, marco cinco niveles, alarma preocupación contenido efectivo optimizado, evaluación métricas, umbrales por nivel, marco salud organizacional',
		'seo.how.og_title': 'El marco de cinco niveles — De Alarma a Optimizado',
		'seo.how.og_description':
			'Reemplaza las evaluaciones subjetivas con métricas objetivas por nivel. Descubre cómo Primer operacionaliza la motivación intrínseca a través de la visibilidad.',

		'seo.pricing.title': 'Precio — Licencia perpetua única de $5,000',
		'seo.pricing.description':
			'Primer cuesta $5,000 una sola vez. Sin suscripciones, sin tarifas por usuario, sin cargos recurrentes. Recibe el código fuente completo y sé dueño para siempre. Autoalójalo en cualquier proveedor Postgres.',
		'seo.pricing.keywords':
			'precio Primer, costo licencia perpetua, licencia software única, gestión desempeño sin suscripción, precio autoalojado, compra código fuente',
		'seo.pricing.og_title': '$5,000 una vez. Tuyo para siempre.',
		'seo.pricing.og_description':
			'Licencia perpetua de código fuente. Sin SaaS. Sin tarifas por usuario. Propiedad completa de tu infraestructura de gestión del desempeño.',

		'seo.about.title': 'Acerca de DavidPM — El equipo detrás de Primer',
		'seo.about.description':
			'DavidPM construye Primer sobre la tesis de que el futuro del software empresarial es la propiedad. Conoce al equipo y los principios detrás del modelo de licencia perpetua.',
		'seo.about.keywords':
			'DavidPM, acerca de Primer, filosofía licencia perpetua, propiedad software, licencia código fuente, quién construye Primer',
		'seo.about.og_title': 'Acerca de DavidPM',
		'seo.about.og_description':
			'Creemos que el futuro del software empresarial es la propiedad, no el alquiler. Conoce al equipo que construye Primer.',

		'seo.faq.title': 'Preguntas frecuentes',
		'seo.faq.description':
			'Respuestas a preguntas comunes sobre Primer: licencias, despliegue, soporte, precios, acceso al código fuente, modificaciones y qué recibes al comprar.',
		'seo.faq.keywords':
			'FAQ Primer, preguntas licencia perpetua, despliegue autoalojado, FAQ licencia código fuente, soporte Primer, cómo desplegar Primer',
		'seo.faq.og_title': 'FAQ de Primer — licencias, despliegue, soporte',
		'seo.faq.og_description':
			'Todo lo que necesitas saber sobre cómo Primer es licenciado, entregado, desplegado y mantenido.',

		'seo.about_pricing.title': 'Filosofía de precios — Por qué un solo precio, para siempre',
		'seo.about_pricing.description':
			'Por qué DavidPM vende Primer como una licencia perpetua única en lugar de una suscripción. El razonamiento detrás de la propiedad sobre el alquiler en software empresarial.',
		'seo.about_pricing.keywords':
			'filosofía precios, razonamiento licencia perpetua, propiedad vs SaaS, licencia única, filosofía propiedad software',
		'seo.about_pricing.og_title': 'Por qué un solo precio, para siempre',
		'seo.about_pricing.og_description':
			'El razonamiento detrás del modelo de licencia perpetua de Primer — por qué no vendemos SaaS.',

		'seo.license.title': 'Términos de licencia perpetua de código fuente',
		'seo.license.description':
			'Primer se vende como una licencia perpetua de código fuente. Lee los términos: acceso completo al código fuente, derechos de modificación, libertad de despliegue, sin dependencia del proveedor.',
		'seo.license.keywords':
			'términos licencia perpetua, licencia código fuente, derechos propiedad software, derechos modificación, sin bloqueo proveedor',
		'seo.license.og_title': 'Licencia perpetua de código fuente',
		'seo.license.og_description':
			'Código fuente completo, derechos de modificación totales, sin dependencia del proveedor. Lee los términos de la licencia.',

		'seo.security.title': 'Seguridad y arquitectura autoalojada',
		'seo.security.description':
			'Modelo de seguridad de Primer: datos controlados por el cliente, código fuente transparente, sin acceso del proveedor tras la compra. Despliega en entornos HIPAA, SOC 2 o ISO 27001 sin negociación con el proveedor.',
		'seo.security.keywords':
			'seguridad Primer, seguridad autoalojada, gestión desempeño compatible HIPAA, residencia datos, software código fuente transparente, sin backdoor proveedor',
		'seo.security.og_title': 'Seguridad a través de la propiedad',
		'seo.security.og_description':
			'Tus datos, tu infraestructura, tu código fuente. Sin backdoor del proveedor. Compatible con entornos HIPAA, SOC 2, ISO 27001.',

		'seo.deployment.title': 'Desplegando Primer — Requisitos y guía',
		'seo.deployment.description':
			'Despliega Primer en cualquier proveedor PostgreSQL (Neon, Railway, Supabase, autoalojado) con alojamiento estándar de Node.js. Agnóstico al proveedor, sin infraestructura propietaria requerida.',
		'seo.deployment.keywords':
			'desplegar Primer, despliegue autoalojado, alojamiento PostgreSQL, despliegue SvelteKit, gestión desempeño Node.js, despliegue on-premise',
		'seo.deployment.og_title': 'Despliega Primer donde corra Postgres',
		'seo.deployment.og_description':
			'Despliegue agnóstico al proveedor. Cualquier PostgreSQL, cualquier host Node.js. Sin bloqueo del proveedor.',

		'seo.contact.title': 'Contactar a DavidPM',
		'seo.contact.description':
			'Ponte en contacto con DavidPM sobre Primer — preguntas de compra, servicios de despliegue o consultas generales sobre el modelo de licencia perpetua.',
		'seo.contact.keywords':
			'contactar DavidPM, ventas Primer, consulta servicio despliegue, preguntas licencia perpetua',
		'seo.contact.og_title': 'Contactar a DavidPM',
		'seo.contact.og_description':
			'¿Preguntas sobre Primer, compras o despliegue? Ponte en contacto.',

		'seo.demo.title': 'Demo interactiva en vivo',
		'seo.demo.description':
			'Explora el marco de niveles de Primer, la ponderación de métricas y el puntaje compuesto a través de una demo interactiva en tres partes. Sin registro.',
		'seo.demo.keywords':
			'demo Primer, demo interactiva, demo marco niveles, demo ponderación métricas, demo gestión desempeño',
		'seo.demo.og_title': 'Prueba Primer — demo interactiva',
		'seo.demo.og_description':
			'Recorrido interactivo en tres partes del marco de niveles de Primer. Sin registro.'
	},

	ar: {
		'seo.site.name': 'Primer',
		'seo.site.tagline': 'ابنِه مرة واحدة. امتلكه إلى الأبد.',
		'seo.org.name': 'DavidPM',
		'seo.org.description':
			'تبني DavidPM منصة Primer، وهي منصة لإدارة الصحة التنظيمية بترخيص دائم للكود المصدري، يستضيفها العملاء على بنيتهم التحتية الخاصة.',
		'seo.product.description':
			'Primer هي منصة لإدارة الأداء تُستضاف ذاتيًا وتُباع كترخيص دائم للكود المصدري مرة واحدة. تستبدل المراجعات الذاتية بتقييم موضوعي قائم على مستويات تشغيلية متدرجة.',

		'seo.home.title': 'منصة إدارة الأداء ذاتية الاستضافة',
		'seo.home.description':
			'Primer منصة إدارة أداء ذاتية الاستضافة بترخيص دائم. شراء لمرة واحدة بقيمة 5,000 دولار، كود مصدري كامل، بدون SaaS، بدون رسوم لكل مستخدم. من DavidPM.',
		'seo.home.keywords':
			'إدارة الأداء، الاستضافة الذاتية، الترخيص الدائم، الكود المصدري، الصحة التنظيمية، OKR، الدافع الداخلي، DavidPM، Primer',
		'seo.home.og_title': 'Primer — ابنِه مرة واحدة. امتلكه إلى الأبد.',
		'seo.home.og_description':
			'منصة صحة تنظيمية ذاتية الاستضافة. ترخيص دائم للكود المصدري بقيمة 5,000 دولار لمرة واحدة. بدون SaaS، بدون اشتراكات، ملكية كاملة.',

		'seo.problem.title': 'لماذا إدارة الأداء معطلة',
		'seo.problem.description':
			'إدارة القيادة والتحكم تصل إلى حد أقصى، و95% من مبادرات الأهداف تفشل. تحليل مدعوم بالأبحاث حول سبب فشل إدارة الأداء التقليدية — وما الذي ينجح بدلاً من ذلك.',
		'seo.problem.keywords':
			'مشاكل إدارة الأداء، لماذا تفشل OKR، الدافع الداخلي، فشل القيادة والتحكم، أبحاث وضع الأهداف، نظرية تقرير الذات',
		'seo.problem.og_title': 'لماذا إدارة الأداء معطلة عالميًا',
		'seo.problem.og_description':
			'95% من مبادرات الأهداف تفشل. القيادة والتحكم لهما سقف صلب. هذه هي الأبحاث، وهذا هو البديل.',

		'seo.how.title': 'كيف يعمل Primer — إطار المستويات الخمسة',
		'seo.how.description':
			'يقيّم Primer الصحة التنظيمية عبر خمسة مستويات تشغيلية: إنذار، قلق، مستقر، فعّال، محسّن. حدد مقاييسك، واضبط العتبات، وتتبّع الأداء الحقيقي.',
		'seo.how.keywords':
			'كيف يعمل Primer، إطار المستويات الخمسة، إنذار قلق مستقر فعال محسن، تقييم المقاييس، عتبات المستويات، إطار الصحة التنظيمية',
		'seo.how.og_title': 'إطار المستويات الخمسة — من الإنذار إلى المحسّن',
		'seo.how.og_description':
			'استبدل المراجعات الذاتية بتقييم موضوعي متدرج للمقاييس. اكتشف كيف يفعّل Primer الدافع الداخلي من خلال الشفافية.',

		'seo.pricing.title': 'التسعير — ترخيص دائم بقيمة 5,000 دولار لمرة واحدة',
		'seo.pricing.description':
			'يكلف Primer 5,000 دولار لمرة واحدة. بدون اشتراكات، بدون رسوم لكل مستخدم، بدون رسوم متكررة. احصل على الكود المصدري الكامل وامتلكه إلى الأبد. استضفه ذاتيًا على أي مزود Postgres.',
		'seo.pricing.keywords':
			'تسعير Primer، تكلفة الترخيص الدائم، ترخيص برنامج لمرة واحدة، إدارة أداء بدون اشتراك، تسعير الاستضافة الذاتية، شراء الكود المصدري',
		'seo.pricing.og_title': '5,000 دولار مرة واحدة. امتلكه إلى الأبد.',
		'seo.pricing.og_description':
			'ترخيص دائم للكود المصدري. بدون SaaS. بدون رسوم لكل مستخدم. ملكية كاملة للبنية التحتية لإدارة الأداء.',

		'seo.about.title': 'حول DavidPM — الفريق وراء Primer',
		'seo.about.description':
			'تبني DavidPM منصة Primer على أساس أطروحة أن مستقبل برامج الأعمال هو الملكية. تعرّف على الفريق والمبادئ وراء نموذج الترخيص الدائم.',
		'seo.about.keywords':
			'DavidPM، حول Primer، فلسفة الترخيص الدائم، ملكية البرامج، ترخيص الكود المصدري، من يبني Primer',
		'seo.about.og_title': 'حول DavidPM',
		'seo.about.og_description':
			'نحن نؤمن أن مستقبل برامج الأعمال هو الملكية، وليس الاستئجار. تعرّف على الفريق الذي يبني Primer.',

		'seo.faq.title': 'الأسئلة الشائعة',
		'seo.faq.description':
			'إجابات على الأسئلة الشائعة حول Primer: الترخيص، النشر، الدعم، التسعير، الوصول إلى الكود المصدري، التعديلات، وما تحصل عليه عند الشراء.',
		'seo.faq.keywords':
			'أسئلة Primer الشائعة، أسئلة الترخيص الدائم، النشر الذاتي، أسئلة ترخيص الكود المصدري، دعم Primer، كيفية نشر Primer',
		'seo.faq.og_title': 'أسئلة Primer الشائعة — الترخيص والنشر والدعم',
		'seo.faq.og_description': 'كل ما تحتاج معرفته حول كيفية ترخيص Primer وتسليمه ونشره وصيانته.',

		'seo.about_pricing.title': 'فلسفة التسعير — لماذا سعر واحد، إلى الأبد',
		'seo.about_pricing.description':
			'لماذا تبيع DavidPM منصة Primer كترخيص دائم لمرة واحدة بدلاً من اشتراك. المنطق وراء الملكية على الاستئجار في برامج الأعمال.',
		'seo.about_pricing.keywords':
			'فلسفة التسعير، منطق الترخيص الدائم، الملكية مقابل SaaS، ترخيص لمرة واحدة، فلسفة ملكية البرامج',
		'seo.about_pricing.og_title': 'لماذا سعر واحد، إلى الأبد',
		'seo.about_pricing.og_description':
			'المنطق وراء نموذج الترخيص الدائم لـ Primer — لماذا لا نبيع SaaS.',

		'seo.license.title': 'شروط الترخيص الدائم للكود المصدري',
		'seo.license.description':
			'يُباع Primer كترخيص دائم للكود المصدري. اقرأ الشروط: وصول كامل للكود المصدري، حقوق التعديل، حرية النشر، بدون تبعية للمورد.',
		'seo.license.keywords':
			'شروط الترخيص الدائم، ترخيص الكود المصدري، حقوق ملكية البرامج، حقوق التعديل، بدون قفل المورد',
		'seo.license.og_title': 'ترخيص دائم للكود المصدري',
		'seo.license.og_description':
			'كود مصدري كامل، حقوق تعديل كاملة، بدون تبعية للمورد. اقرأ شروط الترخيص.',

		'seo.security.title': 'الأمان والبنية ذاتية الاستضافة',
		'seo.security.description':
			'نموذج أمان Primer: بيانات يتحكم بها العميل، كود مصدري شفاف، بدون وصول للمورد بعد الشراء. انشر في بيئات HIPAA أو SOC 2 أو ISO 27001 دون التفاوض مع المورد.',
		'seo.security.keywords':
			'أمان Primer، أمان الاستضافة الذاتية، إدارة أداء متوافقة مع HIPAA، إقامة البيانات، برامج شفافة المصدر، بدون باب خلفي للمورد',
		'seo.security.og_title': 'الأمان من خلال الملكية',
		'seo.security.og_description':
			'بياناتك، بنيتك التحتية، الكود المصدري الخاص بك. بدون باب خلفي للمورد. متوافق مع بيئات HIPAA وSOC 2 وISO 27001.',

		'seo.deployment.title': 'نشر Primer — المتطلبات والدليل',
		'seo.deployment.description':
			'انشر Primer على أي مزود PostgreSQL (Neon أو Railway أو Supabase أو ذاتي الاستضافة) مع استضافة Node.js القياسية. محايد للمورد، لا يتطلب بنية تحتية خاصة.',
		'seo.deployment.keywords':
			'نشر Primer، النشر الذاتي، استضافة PostgreSQL، نشر SvelteKit، إدارة أداء Node.js، النشر داخل المؤسسة',
		'seo.deployment.og_title': 'انشر Primer أينما يعمل Postgres',
		'seo.deployment.og_description':
			'نشر محايد للمورد. أي PostgreSQL، أي مضيف Node.js. بدون قفل المورد.',

		'seo.contact.title': 'تواصل مع DavidPM',
		'seo.contact.description':
			'تواصل مع DavidPM حول Primer — أسئلة الشراء، خدمات النشر، أو استفسارات عامة حول نموذج الترخيص الدائم.',
		'seo.contact.keywords':
			'تواصل مع DavidPM، مبيعات Primer، استفسار خدمة النشر، أسئلة الترخيص الدائم',
		'seo.contact.og_title': 'تواصل مع DavidPM',
		'seo.contact.og_description': 'أسئلة حول Primer أو الشراء أو النشر؟ تواصل معنا.',

		'seo.demo.title': 'عرض توضيحي تفاعلي مباشر',
		'seo.demo.description':
			'استكشف إطار المستويات في Primer، وترجيح المقاييس، والدرجة المركبة من خلال عرض توضيحي تفاعلي من ثلاثة أجزاء. بدون تسجيل.',
		'seo.demo.keywords':
			'عرض Primer، عرض تفاعلي، عرض إطار المستويات، عرض ترجيح المقاييس، عرض إدارة الأداء',
		'seo.demo.og_title': 'جرّب Primer — عرض تفاعلي',
		'seo.demo.og_description': 'جولة تفاعلية من ثلاثة أجزاء لإطار المستويات في Primer. بدون تسجيل.'
	},

	fr: {
		'seo.site.name': 'Primer',
		'seo.site.tagline': 'Construisez une fois. Possédez pour toujours.',
		'seo.org.name': 'DavidPM',
		'seo.org.description':
			'DavidPM développe Primer, une plateforme de santé organisationnelle sous licence perpétuelle de code source que les clients auto-hébergent sur leur propre infrastructure.',
		'seo.product.description':
			'Primer est une plateforme auto-hébergée de gestion de la performance vendue sous licence perpétuelle unique. Remplacez les évaluations subjectives par une évaluation objective des métriques répartie sur cinq niveaux opérationnels.',

		'seo.home.title': 'Plateforme auto-hébergée de gestion de la performance',
		'seo.home.description':
			'Primer est une plateforme auto-hébergée de gestion de la performance sous licence perpétuelle. Achat unique de 5 000 $, code source complet, sans SaaS, sans frais par utilisateur. Par DavidPM.',
		'seo.home.keywords':
			'gestion performance, auto-hébergé, licence perpétuelle, code source, santé organisationnelle, OKR, motivation intrinsèque, DavidPM, Primer',
		'seo.home.og_title': 'Primer — Construisez une fois. Possédez pour toujours.',
		'seo.home.og_description':
			'Plateforme auto-hébergée de santé organisationnelle. Licence perpétuelle de code source de 5 000 $ en une seule fois. Sans SaaS, sans abonnement, propriété totale.',

		'seo.problem.title': 'Pourquoi la gestion de la performance est cassée',
		'seo.problem.description':
			"La gestion par commandement et contrôle plafonne, et 95 % des initiatives d'objectifs échouent. Analyse basée sur la recherche de pourquoi la gestion traditionnelle échoue — et de ce qui fonctionne.",
		'seo.problem.keywords':
			'problèmes gestion performance, pourquoi les OKR échouent, motivation intrinsèque, échec commandement contrôle, recherche fixation objectifs, théorie autodétermination',
		'seo.problem.og_title': 'Pourquoi la gestion de la performance est universellement cassée',
		'seo.problem.og_description':
			"95 % des initiatives d'objectifs échouent. Le commandement et le contrôle ont un plafond dur. Voici la recherche, et l'alternative.",

		'seo.how.title': 'Comment fonctionne Primer — Le cadre à cinq niveaux',
		'seo.how.description':
			'Primer évalue la santé organisationnelle sur cinq niveaux opérationnels : Alarme, Préoccupation, Stable, Efficace, Optimisé. Définissez vos métriques, fixez des seuils, suivez la performance réelle.',
		'seo.how.keywords':
			'comment fonctionne Primer, cadre cinq niveaux, alarme préoccupation stable efficace optimisé, évaluation métriques, seuils niveaux, cadre santé organisationnelle',
		'seo.how.og_title': 'Le cadre à cinq niveaux — De Alarme à Optimisé',
		'seo.how.og_description':
			'Remplacez les évaluations subjectives par une évaluation objective et hiérarchisée des métriques. Découvrez comment Primer opérationnalise la motivation intrinsèque par la visibilité.',

		'seo.pricing.title': 'Tarif — Licence perpétuelle unique à 5 000 $',
		'seo.pricing.description':
			"Primer coûte 5 000 $ en une seule fois. Pas d'abonnement, pas de frais par utilisateur, pas de frais récurrents. Recevez le code source complet et possédez-le pour toujours. Auto-hébergez sur n'importe quel fournisseur Postgres.",
		'seo.pricing.keywords':
			'tarif Primer, coût licence perpétuelle, licence logicielle unique, gestion performance sans abonnement, tarif auto-hébergé, achat code source',
		'seo.pricing.og_title': '5 000 $ une seule fois. Pour toujours.',
		'seo.pricing.og_description':
			'Licence perpétuelle de code source. Pas de SaaS. Pas de frais par utilisateur. Propriété complète de votre infrastructure de gestion de la performance.',

		'seo.about.title': "À propos de DavidPM — L'équipe derrière Primer",
		'seo.about.description':
			"DavidPM construit Primer sur la thèse que l'avenir du logiciel d'entreprise est la propriété. Découvrez l'équipe et les principes derrière le modèle de licence perpétuelle.",
		'seo.about.keywords':
			'DavidPM, à propos de Primer, philosophie licence perpétuelle, propriété logicielle, licence code source, qui construit Primer',
		'seo.about.og_title': 'À propos de DavidPM',
		'seo.about.og_description':
			"Nous croyons que l'avenir du logiciel d'entreprise est la propriété, non la location. Rencontrez l'équipe qui construit Primer.",

		'seo.faq.title': 'Questions fréquentes',
		'seo.faq.description':
			"Réponses aux questions courantes sur Primer : licence, déploiement, support, tarification, accès au code source, modifications, et ce que vous recevez à l'achat.",
		'seo.faq.keywords':
			'FAQ Primer, questions licence perpétuelle, déploiement auto-hébergé, FAQ licence code source, support Primer, comment déployer Primer',
		'seo.faq.og_title': 'FAQ Primer — licence, déploiement, support',
		'seo.faq.og_description':
			'Tout ce que vous devez savoir sur la façon dont Primer est licencié, livré, déployé et maintenu.',

		'seo.about_pricing.title': 'Philosophie tarifaire — Pourquoi un seul prix, pour toujours',
		'seo.about_pricing.description':
			"Pourquoi DavidPM vend Primer comme une licence perpétuelle unique plutôt qu'un abonnement. Le raisonnement derrière la propriété plutôt que la location dans le logiciel d'entreprise.",
		'seo.about_pricing.keywords':
			'philosophie tarifaire, raisonnement licence perpétuelle, propriété vs SaaS, licence unique, philosophie propriété logicielle',
		'seo.about_pricing.og_title': 'Pourquoi un seul prix, pour toujours',
		'seo.about_pricing.og_description':
			'Le raisonnement derrière le modèle de licence perpétuelle de Primer — pourquoi nous ne vendons pas de SaaS.',

		'seo.license.title': 'Conditions de licence perpétuelle de code source',
		'seo.license.description':
			'Primer est vendu sous licence perpétuelle de code source. Lisez les conditions : accès complet au code source, droits de modification, liberté de déploiement, pas de dépendance fournisseur.',
		'seo.license.keywords':
			'conditions licence perpétuelle, licence code source, droits propriété logicielle, droits modification, pas de verrouillage fournisseur',
		'seo.license.og_title': 'Licence perpétuelle de code source',
		'seo.license.og_description':
			'Code source complet, droits de modification complets, pas de dépendance fournisseur. Lisez les conditions.',

		'seo.security.title': 'Sécurité et architecture auto-hébergée',
		'seo.security.description':
			"Modèle de sécurité de Primer : données contrôlées par le client, code transparent, pas d'accès fournisseur après achat. Déployez dans des environnements HIPAA, SOC 2 ou ISO 27001 sans négociation fournisseur.",
		'seo.security.keywords':
			'sécurité Primer, sécurité auto-hébergée, gestion performance conforme HIPAA, résidence données, logiciel source transparent, pas de backdoor fournisseur',
		'seo.security.og_title': 'La sécurité par la propriété',
		'seo.security.og_description':
			'Vos données, votre infrastructure, votre code source. Pas de backdoor fournisseur. Conforme aux environnements HIPAA, SOC 2, ISO 27001.',

		'seo.deployment.title': 'Déployer Primer — Exigences et guide',
		'seo.deployment.description':
			"Déployez Primer sur n'importe quel fournisseur PostgreSQL (Neon, Railway, Supabase, auto-hébergé) avec un hébergement Node.js standard. Agnostique au fournisseur, aucune infrastructure propriétaire requise.",
		'seo.deployment.keywords':
			'déployer Primer, déploiement auto-hébergé, hébergement PostgreSQL, déploiement SvelteKit, gestion performance Node.js, déploiement sur site',
		'seo.deployment.og_title': 'Déployez Primer partout où Postgres fonctionne',
		'seo.deployment.og_description':
			"Déploiement agnostique au fournisseur. N'importe quel PostgreSQL, n'importe quel hôte Node.js. Pas de verrouillage fournisseur.",

		'seo.contact.title': 'Contacter DavidPM',
		'seo.contact.description':
			"Contactez DavidPM à propos de Primer — questions d'achat, prestations de déploiement, ou renseignements généraux sur le modèle de licence perpétuelle.",
		'seo.contact.keywords':
			'contacter DavidPM, ventes Primer, demande prestation déploiement, questions licence perpétuelle',
		'seo.contact.og_title': 'Contacter DavidPM',
		'seo.contact.og_description':
			"Des questions sur Primer, l'achat ou le déploiement ? Contactez-nous.",

		'seo.demo.title': 'Démo interactive en direct',
		'seo.demo.description':
			'Explorez le cadre de niveaux de Primer, la pondération des métriques et le score composite via une démo interactive en trois parties. Aucune inscription requise.',
		'seo.demo.keywords':
			'démo Primer, démo interactive, démo cadre niveaux, démo pondération métriques, démo gestion performance',
		'seo.demo.og_title': 'Essayez Primer — démo interactive',
		'seo.demo.og_description':
			'Parcours interactif en trois parties du cadre de niveaux de Primer. Aucune inscription requise.'
	},

	de: {
		'seo.site.name': 'Primer',
		'seo.site.tagline': 'Einmal bauen. Für immer besitzen.',
		'seo.org.name': 'DavidPM',
		'seo.org.description':
			'DavidPM entwickelt Primer, eine Plattform für organisatorische Gesundheit mit unbefristeter Quellcode-Lizenz, die Kunden auf ihrer eigenen Infrastruktur selbst hosten.',
		'seo.product.description':
			'Primer ist eine selbst gehostete Performance-Management-Plattform, verkauft als einmalige, unbefristete Quellcode-Lizenz. Ersetzt subjektive Bewertungen durch objektive Metrik-Auswertung über fünf Betriebsstufen.',

		'seo.home.title': 'Selbst gehostete Performance-Management-Plattform',
		'seo.home.description':
			'Primer ist eine selbst gehostete Performance-Management-Plattform mit unbefristeter Lizenz. Einmaliger Kauf für 5.000 $, kompletter Quellcode, kein SaaS, keine Gebühren pro Nutzer. Von DavidPM.',
		'seo.home.keywords':
			'Performance-Management, selbst gehostet, unbefristete Lizenz, Quellcode, organisatorische Gesundheit, OKR, intrinsische Motivation, DavidPM, Primer',
		'seo.home.og_title': 'Primer — Einmal bauen. Für immer besitzen.',
		'seo.home.og_description':
			'Selbst gehostete Plattform für organisatorische Gesundheit. Einmalige unbefristete Quellcode-Lizenz für 5.000 $. Kein SaaS, keine Abonnements, volles Eigentum.',

		'seo.problem.title': 'Warum Performance-Management kaputt ist',
		'seo.problem.description':
			'Befehls- und Kontroll-Management stößt an eine Grenze, und 95 % der Zielinitiativen scheitern. Forschungsgestützte Analyse, warum traditionelles Performance-Management versagt — und was funktioniert.',
		'seo.problem.keywords':
			'Performance-Management-Probleme, warum OKRs scheitern, intrinsische Motivation, Versagen Befehl und Kontrolle, Zielsetzungsforschung, Selbstbestimmungstheorie',
		'seo.problem.og_title': 'Warum Performance-Management universell kaputt ist',
		'seo.problem.og_description':
			'95 % der Zielinitiativen scheitern. Befehl und Kontrolle haben eine harte Obergrenze. Hier ist die Forschung, und die Alternative.',

		'seo.how.title': 'Wie Primer funktioniert — Das Fünf-Stufen-Framework',
		'seo.how.description':
			'Primer bewertet die organisatorische Gesundheit über fünf Betriebsstufen: Alarm, Sorge, Stabil, Effektiv, Optimiert. Definieren Sie Metriken, setzen Sie Schwellen, verfolgen Sie reale Leistung.',
		'seo.how.keywords':
			'wie Primer funktioniert, Fünf-Stufen-Framework, Alarm Sorge Stabil Effektiv Optimiert, Metrik-Bewertung, Stufen-Schwellen, Framework organisatorische Gesundheit',
		'seo.how.og_title': 'Das Fünf-Stufen-Framework — von Alarm bis Optimiert',
		'seo.how.og_description':
			'Ersetzen Sie subjektive Bewertungen durch objektive, stufenbasierte Metriken. Sehen Sie, wie Primer intrinsische Motivation durch Sichtbarkeit operationalisiert.',

		'seo.pricing.title': 'Preis — Einmalige unbefristete Lizenz für 5.000 $',
		'seo.pricing.description':
			'Primer kostet 5.000 $ einmalig. Keine Abonnements, keine Gebühren pro Nutzer, keine wiederkehrenden Kosten. Erhalten Sie den kompletten Quellcode und besitzen Sie ihn für immer. Selbst gehostet auf jedem Postgres-Anbieter.',
		'seo.pricing.keywords':
			'Primer Preis, Kosten unbefristete Lizenz, einmalige Softwarelizenz, Performance-Management ohne Abo, Preis selbst gehostet, Quellcode kaufen',
		'seo.pricing.og_title': '5.000 $ einmal. Für immer Ihnen.',
		'seo.pricing.og_description':
			'Unbefristete Quellcode-Lizenz. Kein SaaS. Keine Gebühren pro Nutzer. Volles Eigentum an Ihrer Performance-Management-Infrastruktur.',

		'seo.about.title': 'Über DavidPM — Das Team hinter Primer',
		'seo.about.description':
			'DavidPM baut Primer auf der These auf, dass die Zukunft der Unternehmenssoftware Eigentum ist. Lernen Sie das Team und die Prinzipien hinter dem unbefristeten Lizenzmodell kennen.',
		'seo.about.keywords':
			'DavidPM, über Primer, Philosophie unbefristete Lizenz, Softwareeigentum, Quellcode-Lizenz, wer baut Primer',
		'seo.about.og_title': 'Über DavidPM',
		'seo.about.og_description':
			'Wir glauben, dass die Zukunft der Unternehmenssoftware Eigentum ist, nicht Miete. Lernen Sie das Team hinter Primer kennen.',

		'seo.faq.title': 'Häufig gestellte Fragen',
		'seo.faq.description':
			'Antworten auf häufige Fragen zu Primer: Lizenzierung, Bereitstellung, Support, Preise, Quellcode-Zugang, Modifikationen und was Sie beim Kauf erhalten.',
		'seo.faq.keywords':
			'Primer FAQ, Fragen unbefristete Lizenz, selbst gehostete Bereitstellung, FAQ Quellcode-Lizenz, Primer Support, wie Primer bereitstellen',
		'seo.faq.og_title': 'Primer FAQ — Lizenzierung, Bereitstellung, Support',
		'seo.faq.og_description':
			'Alles, was Sie darüber wissen müssen, wie Primer lizenziert, geliefert, bereitgestellt und gewartet wird.',

		'seo.about_pricing.title': 'Preisphilosophie — Warum ein Preis, für immer',
		'seo.about_pricing.description':
			'Warum DavidPM Primer als einmalige unbefristete Lizenz statt als Abonnement verkauft. Die Begründung für Eigentum statt Miete bei Unternehmenssoftware.',
		'seo.about_pricing.keywords':
			'Preisphilosophie, Begründung unbefristete Lizenz, Eigentum vs SaaS, einmalige Lizenz, Philosophie Softwareeigentum',
		'seo.about_pricing.og_title': 'Warum ein Preis, für immer',
		'seo.about_pricing.og_description':
			'Die Begründung hinter Primers unbefristetem Lizenzmodell — warum wir kein SaaS verkaufen.',

		'seo.license.title': 'Bedingungen der unbefristeten Quellcode-Lizenz',
		'seo.license.description':
			'Primer wird als unbefristete Quellcode-Lizenz verkauft. Lesen Sie die Bedingungen: kompletter Quellcodezugang, Änderungsrechte, Bereitstellungsfreiheit, keine Anbieterbindung.',
		'seo.license.keywords':
			'Bedingungen unbefristete Lizenz, Quellcode-Lizenz, Softwareeigentumsrechte, Änderungsrechte, kein Vendor-Lock-in',
		'seo.license.og_title': 'Unbefristete Quellcode-Lizenz',
		'seo.license.og_description':
			'Kompletter Quellcode, volle Änderungsrechte, keine Anbieterbindung. Lesen Sie die Lizenzbedingungen.',

		'seo.security.title': 'Sicherheit & selbst gehostete Architektur',
		'seo.security.description':
			'Primers Sicherheitsmodell: vom Kunden kontrollierte Daten, quellcode-transparent, kein Anbieterzugriff nach dem Kauf. Bereitstellung in HIPAA-, SOC-2- oder ISO-27001-Umgebungen ohne Anbieterverhandlung.',
		'seo.security.keywords':
			'Primer Sicherheit, Sicherheit selbst gehostet, HIPAA-konformes Performance-Management, Datenstandort, quelloffen transparent, keine Anbieter-Hintertür',
		'seo.security.og_title': 'Sicherheit durch Eigentum',
		'seo.security.og_description':
			'Ihre Daten, Ihre Infrastruktur, Ihr Quellcode. Keine Anbieter-Hintertür. Kompatibel mit HIPAA-, SOC-2-, ISO-27001-Umgebungen.',

		'seo.deployment.title': 'Primer bereitstellen — Anforderungen und Anleitung',
		'seo.deployment.description':
			'Stellen Sie Primer bei jedem PostgreSQL-Anbieter (Neon, Railway, Supabase, selbst gehostet) mit Standard-Node.js-Hosting bereit. Anbieterunabhängig, keine proprietäre Infrastruktur erforderlich.',
		'seo.deployment.keywords':
			'Primer bereitstellen, Bereitstellung selbst gehostet, PostgreSQL-Hosting, SvelteKit-Bereitstellung, Node.js Performance-Management, On-Premise-Bereitstellung',
		'seo.deployment.og_title': 'Stellen Sie Primer überall bereit, wo Postgres läuft',
		'seo.deployment.og_description':
			'Anbieterunabhängige Bereitstellung. Jedes PostgreSQL, jeder Node.js-Host. Kein Vendor-Lock-in.',

		'seo.contact.title': 'DavidPM kontaktieren',
		'seo.contact.description':
			'Kontaktieren Sie DavidPM zu Primer — Kauffragen, Bereitstellungsengagements oder allgemeine Anfragen zum unbefristeten Lizenzmodell.',
		'seo.contact.keywords':
			'DavidPM kontaktieren, Primer Vertrieb, Bereitstellungsanfrage, Fragen unbefristete Lizenz',
		'seo.contact.og_title': 'DavidPM kontaktieren',
		'seo.contact.og_description':
			'Fragen zu Primer, Kauf oder Bereitstellung? Nehmen Sie Kontakt auf.',

		'seo.demo.title': 'Live-Interaktiv-Demo',
		'seo.demo.description':
			'Erkunden Sie Primers Stufen-Framework, Metrik-Gewichtung und zusammengesetzte Bewertung durch eine dreiteilige interaktive Demo. Keine Anmeldung erforderlich.',
		'seo.demo.keywords':
			'Primer Demo, interaktive Demo, Demo Stufen-Framework, Demo Metrik-Gewichtung, Demo Performance-Management',
		'seo.demo.og_title': 'Primer ausprobieren — interaktive Demo',
		'seo.demo.og_description':
			'Dreiteiliger interaktiver Rundgang durch Primers Stufen-Framework. Keine Anmeldung erforderlich.'
	},

	ja: {
		'seo.site.name': 'Primer',
		'seo.site.tagline': '一度構築し、永久に所有する。',
		'seo.org.name': 'DavidPM',
		'seo.org.description':
			'DavidPMは、顧客が自社のインフラ上でセルフホストする、永久ソースコードライセンスによる組織健全性プラットフォーム「Primer」を開発しています。',
		'seo.product.description':
			'Primerは、一度限りの永久ソースコードライセンスとして販売されるセルフホスト型パフォーマンス管理プラットフォームです。主観的なレビューを、5つの運用レベルに基づく客観的な指標評価に置き換えます。',

		'seo.home.title': 'セルフホスト型パフォーマンス管理プラットフォーム',
		'seo.home.description':
			'Primerは、永久ライセンスのセルフホスト型パフォーマンス管理プラットフォームです。一度限りの5,000ドル購入、完全なソースコード、SaaSなし、席数課金なし。DavidPM提供。',
		'seo.home.keywords':
			'パフォーマンス管理, セルフホスト, 永久ライセンス, ソースコード, 組織健全性, OKR, 内発的動機, DavidPM, Primer',
		'seo.home.og_title': 'Primer — 一度構築し、永久に所有する。',
		'seo.home.og_description':
			'セルフホスト型の組織健全性プラットフォーム。一度限り5,000ドルの永久ソースコードライセンス。SaaSなし、サブスクリプションなし、完全所有。',

		'seo.problem.title': 'なぜパフォーマンス管理は壊れているのか',
		'seo.problem.description':
			'命令と管理型マネジメントは頭打ちになり、目標プログラムの95%が失敗します。従来のパフォーマンス管理がなぜ機能しないのか、そして何が機能するのかを研究に基づいて分析します。',
		'seo.problem.keywords':
			'パフォーマンス管理の問題, OKRが失敗する理由, 内発的動機, 命令管理の失敗, 目標設定研究, 自己決定理論',
		'seo.problem.og_title': 'なぜパフォーマンス管理は普遍的に壊れているのか',
		'seo.problem.og_description':
			'目標プログラムの95%が失敗します。命令と管理には明確な上限があります。ここに研究と代替案があります。',

		'seo.how.title': 'Primerの仕組み — 5階層フレームワーク',
		'seo.how.description':
			'Primerは、警戒・懸念・安定・有効・最適化という5つの運用レベルで組織の健全性を評価します。指標を定義し、しきい値を設定し、実際のパフォーマンスを追跡します。',
		'seo.how.keywords':
			'Primerの仕組み, 5階層フレームワーク, 警戒 懸念 安定 有効 最適化, 指標評価, 階層しきい値, 組織健全性フレームワーク',
		'seo.how.og_title': '5階層フレームワーク — 警戒から最適化まで',
		'seo.how.og_description':
			'主観的なレビューを、客観的で階層化された指標評価に置き換えます。Primerが可視性を通じて内発的動機をどう運用化するかをご覧ください。',

		'seo.pricing.title': '価格 — 一度限り5,000ドルの永久ライセンス',
		'seo.pricing.description':
			'Primerは一度限り5,000ドルです。サブスクリプションなし、席数課金なし、継続料金なし。完全なソースコードを受け取り、永久に所有できます。任意のPostgresプロバイダでセルフホスト可能。',
		'seo.pricing.keywords':
			'Primer価格, 永久ライセンスコスト, 一度限りのソフトウェアライセンス, サブスクなしパフォーマンス管理, セルフホスト価格, ソースコード購入',
		'seo.pricing.og_title': '5,000ドル一度きり。永久にあなたのもの。',
		'seo.pricing.og_description':
			'永久ソースコードライセンス。SaaSなし。席数課金なし。パフォーマンス管理インフラの完全所有。',

		'seo.about.title': 'DavidPMについて — Primerを支えるチーム',
		'seo.about.description':
			'DavidPMは、ビジネスソフトウェアの未来は「所有」であるという論に基づきPrimerを構築しています。チームと永久ライセンスモデルの背後にある原則をご紹介します。',
		'seo.about.keywords':
			'DavidPM, Primerについて, 永久ライセンスの哲学, ソフトウェア所有, ソースコードライセンス, 誰がPrimerを作るのか',
		'seo.about.og_title': 'DavidPMについて',
		'seo.about.og_description':
			'ビジネスソフトウェアの未来は賃貸ではなく所有であると信じています。Primerを作るチームをご紹介します。',

		'seo.faq.title': 'よくある質問',
		'seo.faq.description':
			'Primerに関するよくある質問への回答:ライセンス、デプロイ、サポート、価格、ソースコードアクセス、改変、購入時に何を受け取るか。',
		'seo.faq.keywords':
			'Primer FAQ, 永久ライセンスに関する質問, セルフホストデプロイ, ソースコードライセンスFAQ, Primerサポート, Primerのデプロイ方法',
		'seo.faq.og_title': 'Primer FAQ — ライセンス、デプロイ、サポート',
		'seo.faq.og_description':
			'Primerがどのようにライセンス、配布、デプロイ、保守されるかについて知っておくべきすべてのこと。',

		'seo.about_pricing.title': '価格哲学 — なぜ一つの価格で永久なのか',
		'seo.about_pricing.description':
			'DavidPMがなぜPrimerをサブスクリプションではなく一度限りの永久ライセンスとして販売するのか。ビジネスソフトウェアにおいて所有が賃貸に勝る理由。',
		'seo.about_pricing.keywords':
			'価格哲学, 永久ライセンスの理由, 所有 vs SaaS, 一度限りのライセンス, ソフトウェア所有の哲学',
		'seo.about_pricing.og_title': 'なぜ一つの価格で永久なのか',
		'seo.about_pricing.og_description':
			'Primerの永久ライセンスモデルの背後にある理由 — なぜ私たちがSaaSを販売しないのか。',

		'seo.license.title': '永久ソースコードライセンス条項',
		'seo.license.description':
			'Primerは永久ソースコードライセンスとして販売されます。条項をお読みください:完全なソースコードアクセス、改変権、デプロイの自由、ベンダー依存なし。',
		'seo.license.keywords':
			'永久ライセンス条項, ソースコードライセンス, ソフトウェア所有権, 改変権, ベンダーロックインなし',
		'seo.license.og_title': '永久ソースコードライセンス',
		'seo.license.og_description':
			'完全なソースコード、完全な改変権、ベンダー依存なし。ライセンス条項をお読みください。',

		'seo.security.title': 'セキュリティとセルフホストアーキテクチャ',
		'seo.security.description':
			'Primerのセキュリティモデル:顧客が管理するデータ、ソース透明性のあるコード、購入後のベンダーアクセスなし。ベンダー交渉なしでHIPAA、SOC 2、ISO 27001環境にデプロイ可能。',
		'seo.security.keywords':
			'Primerセキュリティ, セルフホストセキュリティ, HIPAA準拠パフォーマンス管理, データレジデンシー, ソース透明性のあるソフトウェア, ベンダーバックドアなし',
		'seo.security.og_title': '所有によるセキュリティ',
		'seo.security.og_description':
			'あなたのデータ、あなたのインフラ、あなたのソースコード。ベンダーバックドアなし。HIPAA、SOC 2、ISO 27001環境に対応。',

		'seo.deployment.title': 'Primerのデプロイ — 要件とガイド',
		'seo.deployment.description':
			'任意のPostgreSQLプロバイダ(Neon、Railway、Supabase、セルフホスト)と標準的なNode.jsホスティング上でPrimerをデプロイ。プロバイダ非依存、専有インフラ不要。',
		'seo.deployment.keywords':
			'Primerデプロイ, セルフホストデプロイ, PostgreSQLホスティング, SvelteKitデプロイ, Node.jsパフォーマンス管理, オンプレミスデプロイ',
		'seo.deployment.og_title': 'Postgresが動くところならどこでもPrimerをデプロイ',
		'seo.deployment.og_description':
			'プロバイダ非依存のデプロイ。任意のPostgreSQL、任意のNode.jsホスト。ベンダーロックインなし。',

		'seo.contact.title': 'DavidPMに連絡する',
		'seo.contact.description':
			'Primerに関してDavidPMへお問い合わせください — 購入に関する質問、デプロイ支援、または永久ライセンスモデルに関する一般的なお問い合わせ。',
		'seo.contact.keywords': 'DavidPMに連絡, Primer販売, デプロイ支援問い合わせ, 永久ライセンス質問',
		'seo.contact.og_title': 'DavidPMに連絡する',
		'seo.contact.og_description':
			'Primer、購入、デプロイに関する質問はありますか?お問い合わせください。',

		'seo.demo.title': 'ライブインタラクティブデモ',
		'seo.demo.description':
			'3部構成のインタラクティブデモで、Primerの階層フレームワーク、指標の重み付け、総合スコアを探索できます。サインアップ不要。',
		'seo.demo.keywords':
			'Primerデモ, インタラクティブデモ, 階層フレームワークデモ, 指標重み付けデモ, パフォーマンス管理デモ',
		'seo.demo.og_title': 'Primerを試す — インタラクティブデモ',
		'seo.demo.og_description':
			'Primerの階層フレームワークを3部構成でインタラクティブにウォークスルー。サインアップ不要。'
	},

	pt: {
		'seo.site.name': 'Primer',
		'seo.site.tagline': 'Construa uma vez. Seu para sempre.',
		'seo.org.name': 'DavidPM',
		'seo.org.description':
			'A DavidPM desenvolve o Primer — uma plataforma de saúde organizacional com licença perpétua de código-fonte que os clientes hospedam em sua própria infraestrutura.',
		'seo.product.description':
			'Primer é uma plataforma autogestionada de gestão de desempenho vendida como licença perpétua de código-fonte única. Substitui avaliações subjetivas por avaliação objetiva de métricas em cinco níveis operacionais.',

		'seo.home.title': 'Plataforma autogestionada de gestão de desempenho',
		'seo.home.description':
			'Primer é uma plataforma autogestionada de gestão de desempenho com licença perpétua. Compra única de US$ 5.000, código-fonte completo, sem SaaS, sem taxas por usuário. Pela DavidPM.',
		'seo.home.keywords':
			'gestão de desempenho, autogestionado, licença perpétua, código-fonte, saúde organizacional, OKR, motivação intrínseca, DavidPM, Primer',
		'seo.home.og_title': 'Primer — Construa uma vez. Seu para sempre.',
		'seo.home.og_description':
			'Plataforma autogestionada de saúde organizacional. Licença perpétua de código-fonte por US$ 5.000 única. Sem SaaS, sem assinaturas, propriedade total.',

		'seo.problem.title': 'Por que a gestão de desempenho está quebrada',
		'seo.problem.description':
			'A gestão de comando e controle atinge um teto, e 95% das iniciativas de metas fracassam. Análise baseada em pesquisa sobre por que a gestão tradicional falha — e o que funciona.',
		'seo.problem.keywords':
			'problemas gestão desempenho, por que OKRs falham, motivação intrínseca, falha comando e controle, pesquisa definição metas, teoria autodeterminação',
		'seo.problem.og_title': 'Por que a gestão de desempenho está universalmente quebrada',
		'seo.problem.og_description':
			'95% das iniciativas de metas fracassam. Comando e controle têm um teto rígido. Aqui está a pesquisa e a alternativa.',

		'seo.how.title': 'Como o Primer funciona — O framework de cinco níveis',
		'seo.how.description':
			'O Primer avalia a saúde organizacional em cinco níveis operacionais: Alarme, Preocupação, Estável, Eficaz, Otimizado. Defina suas métricas, estabeleça limiares e monitore o desempenho real.',
		'seo.how.keywords':
			'como o Primer funciona, framework cinco níveis, alarme preocupação estável eficaz otimizado, avaliação métricas, limiares níveis, framework saúde organizacional',
		'seo.how.og_title': 'O framework de cinco níveis — De Alarme a Otimizado',
		'seo.how.og_description':
			'Substitua avaliações subjetivas por métricas objetivas em níveis. Veja como o Primer operacionaliza a motivação intrínseca através da visibilidade.',

		'seo.pricing.title': 'Preço — Licença perpétua única de US$ 5.000',
		'seo.pricing.description':
			'O Primer custa US$ 5.000 uma única vez. Sem assinaturas, sem taxas por usuário, sem cobranças recorrentes. Receba o código-fonte completo e seja dono para sempre. Autogerenciado em qualquer provedor Postgres.',
		'seo.pricing.keywords':
			'preço Primer, custo licença perpétua, licença software única, gestão desempenho sem assinatura, preço autogestionado, compra código-fonte',
		'seo.pricing.og_title': 'US$ 5.000 uma vez. Seu para sempre.',
		'seo.pricing.og_description':
			'Licença perpétua de código-fonte. Sem SaaS. Sem taxas por usuário. Propriedade completa da sua infraestrutura de gestão de desempenho.',

		'seo.about.title': 'Sobre a DavidPM — A equipe por trás do Primer',
		'seo.about.description':
			'A DavidPM constrói o Primer sobre a tese de que o futuro do software empresarial é a propriedade. Conheça a equipe e os princípios por trás do modelo de licença perpétua.',
		'seo.about.keywords':
			'DavidPM, sobre o Primer, filosofia licença perpétua, propriedade de software, licença código-fonte, quem constrói o Primer',
		'seo.about.og_title': 'Sobre a DavidPM',
		'seo.about.og_description':
			'Acreditamos que o futuro do software empresarial é a propriedade, não o aluguel. Conheça a equipe que constrói o Primer.',

		'seo.faq.title': 'Perguntas frequentes',
		'seo.faq.description':
			'Respostas para perguntas comuns sobre o Primer: licenciamento, implantação, suporte, preços, acesso ao código-fonte, modificações e o que você recebe ao comprar.',
		'seo.faq.keywords':
			'FAQ Primer, perguntas licença perpétua, implantação autogestionada, FAQ licença código-fonte, suporte Primer, como implantar Primer',
		'seo.faq.og_title': 'FAQ do Primer — licenciamento, implantação, suporte',
		'seo.faq.og_description':
			'Tudo o que você precisa saber sobre como o Primer é licenciado, entregue, implantado e mantido.',

		'seo.about_pricing.title': 'Filosofia de preços — Por que um preço, para sempre',
		'seo.about_pricing.description':
			'Por que a DavidPM vende o Primer como uma licença perpétua única em vez de uma assinatura. O raciocínio por trás da propriedade sobre o aluguel em software empresarial.',
		'seo.about_pricing.keywords':
			'filosofia preços, raciocínio licença perpétua, propriedade vs SaaS, licença única, filosofia propriedade de software',
		'seo.about_pricing.og_title': 'Por que um preço, para sempre',
		'seo.about_pricing.og_description':
			'O raciocínio por trás do modelo de licença perpétua do Primer — por que não vendemos SaaS.',

		'seo.license.title': 'Termos da licença perpétua de código-fonte',
		'seo.license.description':
			'O Primer é vendido como uma licença perpétua de código-fonte. Leia os termos: acesso completo ao código-fonte, direitos de modificação, liberdade de implantação, sem dependência do fornecedor.',
		'seo.license.keywords':
			'termos licença perpétua, licença código-fonte, direitos propriedade software, direitos modificação, sem bloqueio de fornecedor',
		'seo.license.og_title': 'Licença perpétua de código-fonte',
		'seo.license.og_description':
			'Código-fonte completo, direitos totais de modificação, sem dependência do fornecedor. Leia os termos.',

		'seo.security.title': 'Segurança e arquitetura autogestionada',
		'seo.security.description':
			'Modelo de segurança do Primer: dados controlados pelo cliente, código transparente, sem acesso do fornecedor após a compra. Implante em ambientes HIPAA, SOC 2 ou ISO 27001 sem negociação com fornecedor.',
		'seo.security.keywords':
			'segurança Primer, segurança autogestionada, gestão desempenho compatível HIPAA, residência de dados, software com código transparente, sem backdoor do fornecedor',
		'seo.security.og_title': 'Segurança através da propriedade',
		'seo.security.og_description':
			'Seus dados, sua infraestrutura, seu código-fonte. Sem backdoor do fornecedor. Compatível com ambientes HIPAA, SOC 2, ISO 27001.',

		'seo.deployment.title': 'Implantando o Primer — Requisitos e guia',
		'seo.deployment.description':
			'Implante o Primer em qualquer provedor PostgreSQL (Neon, Railway, Supabase, autogestionado) com hospedagem Node.js padrão. Agnóstico ao fornecedor, sem infraestrutura proprietária necessária.',
		'seo.deployment.keywords':
			'implantar Primer, implantação autogestionada, hospedagem PostgreSQL, implantação SvelteKit, gestão desempenho Node.js, implantação on-premise',
		'seo.deployment.og_title': 'Implante o Primer onde o Postgres rodar',
		'seo.deployment.og_description':
			'Implantação agnóstica ao fornecedor. Qualquer PostgreSQL, qualquer host Node.js. Sem bloqueio de fornecedor.',

		'seo.contact.title': 'Contato DavidPM',
		'seo.contact.description':
			'Entre em contato com a DavidPM sobre o Primer — perguntas de compra, serviços de implantação ou consultas gerais sobre o modelo de licença perpétua.',
		'seo.contact.keywords':
			'contato DavidPM, vendas Primer, consulta serviço implantação, perguntas licença perpétua',
		'seo.contact.og_title': 'Contato DavidPM',
		'seo.contact.og_description':
			'Perguntas sobre o Primer, compra ou implantação? Entre em contato.',

		'seo.demo.title': 'Demo interativa ao vivo',
		'seo.demo.description':
			'Explore o framework de níveis do Primer, a ponderação de métricas e a pontuação composta através de uma demo interativa em três partes. Sem cadastro.',
		'seo.demo.keywords':
			'demo Primer, demo interativa, demo framework níveis, demo ponderação métricas, demo gestão desempenho',
		'seo.demo.og_title': 'Experimente o Primer — demo interativa',
		'seo.demo.og_description':
			'Tutorial interativo em três partes do framework de níveis do Primer. Sem cadastro.'
	},

	ko: {
		'seo.site.name': 'Primer',
		'seo.site.tagline': '한 번 구축하고 영원히 소유하세요.',
		'seo.org.name': 'DavidPM',
		'seo.org.description':
			'DavidPM은 고객이 자체 인프라에서 직접 호스팅하는 영구 소스 코드 라이선스의 조직 건전성 플랫폼인 Primer를 개발합니다.',
		'seo.product.description':
			'Primer는 일회성 영구 소스 코드 라이선스로 판매되는 셀프호스팅 성과 관리 플랫폼입니다. 주관적인 평가를 다섯 가지 운영 단계의 객관적인 지표 평가로 대체합니다.',

		'seo.home.title': '셀프호스팅 성과 관리 플랫폼',
		'seo.home.description':
			'Primer는 영구 라이선스의 셀프호스팅 성과 관리 플랫폼입니다. 일회성 5,000달러 구매, 완전한 소스 코드, SaaS 없음, 좌석당 요금 없음. DavidPM 제작.',
		'seo.home.keywords':
			'성과 관리, 셀프호스팅, 영구 라이선스, 소스 코드, 조직 건전성, OKR, 내재적 동기, DavidPM, Primer',
		'seo.home.og_title': 'Primer — 한 번 구축하고 영원히 소유하세요.',
		'seo.home.og_description':
			'셀프호스팅 조직 건전성 플랫폼. 일회성 5,000달러 영구 소스 코드 라이선스. SaaS 없음, 구독 없음, 완전한 소유권.',

		'seo.problem.title': '왜 성과 관리는 고장 났는가',
		'seo.problem.description':
			'명령-통제식 관리는 한계에 도달하고, 목표 이니셔티브의 95%가 실패합니다. 전통적 성과 관리가 왜 실패하는지, 그리고 무엇이 효과적인지에 대한 연구 기반 분석.',
		'seo.problem.keywords':
			'성과 관리 문제, OKR 실패 이유, 내재적 동기, 명령 통제 실패, 목표 설정 연구, 자기결정이론',
		'seo.problem.og_title': '왜 성과 관리는 보편적으로 고장 났는가',
		'seo.problem.og_description':
			'목표 이니셔티브의 95%가 실패합니다. 명령과 통제에는 확실한 천장이 있습니다. 여기 연구와 대안이 있습니다.',

		'seo.how.title': 'Primer 작동 원리 — 5단계 프레임워크',
		'seo.how.description':
			'Primer는 경보, 우려, 안정, 효과적, 최적화의 다섯 가지 운영 단계에 걸쳐 조직 건전성을 평가합니다. 지표를 정의하고, 임계값을 설정하고, 실제 성과를 추적하세요.',
		'seo.how.keywords':
			'Primer 작동 원리, 5단계 프레임워크, 경보 우려 안정 효과적 최적화, 지표 평가, 단계 임계값, 조직 건전성 프레임워크',
		'seo.how.og_title': '5단계 프레임워크 — 경보에서 최적화까지',
		'seo.how.og_description':
			'주관적인 평가를 객관적이고 단계화된 지표 평가로 대체하세요. Primer가 가시성을 통해 내재적 동기를 어떻게 운영화하는지 확인하세요.',

		'seo.pricing.title': '가격 — 일회성 5,000달러 영구 라이선스',
		'seo.pricing.description':
			'Primer는 일회성 5,000달러입니다. 구독 없음, 좌석당 요금 없음, 반복 요금 없음. 완전한 소스 코드를 받고 영원히 소유하세요. 모든 Postgres 제공업체에서 셀프호스팅 가능.',
		'seo.pricing.keywords':
			'Primer 가격, 영구 라이선스 비용, 일회성 소프트웨어 라이선스, 구독 없는 성과 관리, 셀프호스팅 가격, 소스 코드 구매',
		'seo.pricing.og_title': '5,000달러 한 번. 영원히 당신의 것.',
		'seo.pricing.og_description':
			'영구 소스 코드 라이선스. SaaS 없음. 좌석당 요금 없음. 성과 관리 인프라의 완전한 소유권.',

		'seo.about.title': 'DavidPM 소개 — Primer를 만든 팀',
		'seo.about.description':
			'DavidPM은 비즈니스 소프트웨어의 미래가 소유권이라는 명제 위에 Primer를 구축합니다. 팀과 영구 라이선스 모델의 원칙을 알아보세요.',
		'seo.about.keywords':
			'DavidPM, Primer 소개, 영구 라이선스 철학, 소프트웨어 소유권, 소스 코드 라이선스, 누가 Primer를 만드는가',
		'seo.about.og_title': 'DavidPM 소개',
		'seo.about.og_description':
			'우리는 비즈니스 소프트웨어의 미래가 임대가 아닌 소유라고 믿습니다. Primer를 만드는 팀을 만나보세요.',

		'seo.faq.title': '자주 묻는 질문',
		'seo.faq.description':
			'Primer에 대한 일반적인 질문에 대한 답변: 라이선싱, 배포, 지원, 가격, 소스 코드 액세스, 수정, 구매 시 받는 것.',
		'seo.faq.keywords':
			'Primer FAQ, 영구 라이선스 질문, 셀프호스팅 배포, 소스 코드 라이선스 FAQ, Primer 지원, Primer 배포 방법',
		'seo.faq.og_title': 'Primer FAQ — 라이선싱, 배포, 지원',
		'seo.faq.og_description':
			'Primer가 어떻게 라이선스되고, 배송되고, 배포되고, 유지 관리되는지에 대해 알아야 할 모든 것.',

		'seo.about_pricing.title': '가격 철학 — 왜 하나의 가격, 영원히',
		'seo.about_pricing.description':
			'DavidPM이 왜 Primer를 구독이 아닌 일회성 영구 라이선스로 판매하는지. 비즈니스 소프트웨어에서 임대보다 소유를 선호하는 이유.',
		'seo.about_pricing.keywords':
			'가격 철학, 영구 라이선스 이유, 소유권 vs SaaS, 일회성 라이선스, 소프트웨어 소유권 철학',
		'seo.about_pricing.og_title': '왜 하나의 가격, 영원히',
		'seo.about_pricing.og_description':
			'Primer 영구 라이선스 모델의 이유 — 왜 우리가 SaaS를 판매하지 않는가.',

		'seo.license.title': '영구 소스 코드 라이선스 약관',
		'seo.license.description':
			'Primer는 영구 소스 코드 라이선스로 판매됩니다. 약관을 읽어보세요: 완전한 소스 코드 액세스, 수정 권한, 배포 자유, 공급업체 종속 없음.',
		'seo.license.keywords':
			'영구 라이선스 약관, 소스 코드 라이선스, 소프트웨어 소유권, 수정 권한, 공급업체 종속 없음',
		'seo.license.og_title': '영구 소스 코드 라이선스',
		'seo.license.og_description':
			'완전한 소스 코드, 완전한 수정 권한, 공급업체 종속 없음. 라이선스 약관을 읽어보세요.',

		'seo.security.title': '보안 및 셀프호스팅 아키텍처',
		'seo.security.description':
			'Primer의 보안 모델: 고객이 관리하는 데이터, 소스가 투명한 코드, 구매 후 공급업체 액세스 없음. 공급업체 협상 없이 HIPAA, SOC 2 또는 ISO 27001 환경에 배포 가능.',
		'seo.security.keywords':
			'Primer 보안, 셀프호스팅 보안, HIPAA 준수 성과 관리, 데이터 거주지, 소스 투명 소프트웨어, 공급업체 백도어 없음',
		'seo.security.og_title': '소유를 통한 보안',
		'seo.security.og_description':
			'당신의 데이터, 당신의 인프라, 당신의 소스 코드. 공급업체 백도어 없음. HIPAA, SOC 2, ISO 27001 환경과 호환.',

		'seo.deployment.title': 'Primer 배포 — 요구사항 및 가이드',
		'seo.deployment.description':
			'모든 PostgreSQL 제공업체(Neon, Railway, Supabase, 셀프호스팅)와 표준 Node.js 호스팅에서 Primer를 배포하세요. 공급업체 독립적, 독점 인프라 불필요.',
		'seo.deployment.keywords':
			'Primer 배포, 셀프호스팅 배포, PostgreSQL 호스팅, SvelteKit 배포, Node.js 성과 관리, 온프레미스 배포',
		'seo.deployment.og_title': 'Postgres가 실행되는 곳이라면 어디서든 Primer 배포',
		'seo.deployment.og_description':
			'공급업체 독립적 배포. 모든 PostgreSQL, 모든 Node.js 호스트. 공급업체 종속 없음.',

		'seo.contact.title': 'DavidPM 연락처',
		'seo.contact.description':
			'Primer에 대해 DavidPM에 문의하세요 — 구매 문의, 배포 서비스 또는 영구 라이선스 모델에 대한 일반 문의.',
		'seo.contact.keywords': 'DavidPM 연락, Primer 판매, 배포 서비스 문의, 영구 라이선스 질문',
		'seo.contact.og_title': 'DavidPM 연락처',
		'seo.contact.og_description': 'Primer, 구매 또는 배포에 대한 질문이 있으신가요? 연락 주세요.',

		'seo.demo.title': '실시간 인터랙티브 데모',
		'seo.demo.description':
			'3부 인터랙티브 데모를 통해 Primer의 단계 프레임워크, 지표 가중치 및 종합 점수를 탐색하세요. 가입 불필요.',
		'seo.demo.keywords':
			'Primer 데모, 인터랙티브 데모, 단계 프레임워크 데모, 지표 가중치 데모, 성과 관리 데모',
		'seo.demo.og_title': 'Primer 체험 — 인터랙티브 데모',
		'seo.demo.og_description':
			'Primer의 단계 프레임워크를 3부 인터랙티브 데모로 둘러보세요. 가입 불필요.'
	}
};

// -----------------------------------------------------------------------
// Merge into each locale file
// -----------------------------------------------------------------------

for (const [locale, seoKeys] of Object.entries(translations)) {
	const filePath = join(I18N_DIR, `${locale}.json`);
	const raw = readFileSync(filePath, 'utf8');
	const obj = JSON.parse(raw);

	let added = 0;
	for (const [key, value] of Object.entries(seoKeys)) {
		if (!(key in obj)) {
			added++;
		}
		obj[key] = value;
	}

	// Preserve the existing file style: 2-space indent, trailing newline.
	const out = JSON.stringify(obj, null, 2) + '\n';
	writeFileSync(filePath, out);

	console.log(`[${locale}] wrote ${Object.keys(seoKeys).length} keys (${added} new)`);
}
