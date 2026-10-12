"use client";

import { ArrowLeft, Globe2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/shared";

type LegalDocument = {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: {
    heading: string;
    body: string[];
  }[];
};

const terms: Record<Locale, LegalDocument> = {
  en: {
    title: "Terms of Service",
    effectiveDate: "Effective date: July 6, 2026",
    intro:
      "These Terms of Service explain the basic rules for using deepSea. deepSea is an early social networking prototype, so features may change as the product improves.",
    sections: [
      {
        heading: "1. Eligibility and accounts",
        body: [
          "You must provide accurate account information and keep your password secure.",
          "You are responsible for activity that happens through your account. If you believe your account has been compromised, stop using it and contact support.",
        ],
      },
      {
        heading: "2. User content",
        body: [
          "You keep ownership of the posts, comments, media, profile information, and other content you submit.",
          "By posting content, you grant deepSea a worldwide, non-exclusive license to host, store, display, reproduce, and distribute that content as needed to operate the service.",
        ],
      },
      {
        heading: "3. Acceptable use",
        body: [
          "Do not use deepSea to harass others, impersonate people, distribute spam, post illegal content, exploit minors, or share private information without consent.",
          "Do not attempt to disrupt the service, bypass security controls, scrape at abusive scale, or access accounts or data that are not yours.",
        ],
      },
      {
        heading: "4. Moderation and enforcement",
        body: [
          "deepSea may review reports, hide content, limit account abilities, invalidate accounts, or remove access when we believe these Terms or the safety of the service require it.",
          "Moderation decisions may rely on user reports, automated signals, administrator review, or legal requirements.",
        ],
      },
      {
        heading: "5. Service changes",
        body: [
          "deepSea may add, remove, suspend, or change features at any time, especially while the product remains in prototype development.",
          "We may update these Terms. If changes are material, we will make reasonable efforts to provide notice in the product or through another appropriate channel.",
        ],
      },
      {
        heading: "6. Disclaimers",
        body: [
          "The service is provided as is and as available. We do not promise uninterrupted availability, error-free operation, or that all content will be preserved forever.",
          "You use the service at your own discretion and are responsible for backing up content that matters to you.",
        ],
      },
      {
        heading: "7. Limitation of liability",
        body: [
          "To the maximum extent permitted by law, deepSea is not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of data, profits, goodwill, or opportunities.",
        ],
      },
      {
        heading: "8. Contact",
        body: ["Questions about these Terms can be sent to the site operator or support contact shown in the product."],
      },
    ],
  },
  zh: {
    title: "服务条款",
    effectiveDate: "生效日期：2026年7月6日",
    intro: "本服务条款说明使用 deepSea 的基本规则。deepSea 目前是一个早期社交网络原型，因此功能可能会随着产品迭代而调整。",
    sections: [
      {
        heading: "1. 资格与账号",
        body: [
          "你应提供准确的账号信息，并妥善保管自己的密码。",
          "你需要对自己账号下发生的活动负责。如果你认为账号被盗用，请停止使用并联系支持。",
        ],
      },
      {
        heading: "2. 用户内容",
        body: [
          "你保留对自己发布的帖子、评论、媒体、个人资料和其他内容的所有权。",
          "当你发布内容时，你授予 deepSea 一项全球范围、非独占的许可，使 deepSea 可以为运营服务之目的托管、存储、展示、复制和分发这些内容。",
        ],
      },
      {
        heading: "3. 可接受使用",
        body: [
          "不得使用 deepSea 骚扰他人、冒充他人、发布垃圾信息、发布违法内容、危害未成年人，或未经同意分享他人隐私信息。",
          "不得试图破坏服务、绕过安全措施、进行滥用规模的数据抓取，或访问不属于你的账号和数据。",
        ],
      },
      {
        heading: "4. 内容治理与执行",
        body: [
          "当我们认为内容或账号违反本条款，或影响服务安全时，deepSea 可以审核举报、隐藏内容、限制账号能力、无效化账号或移除访问权限。",
          "治理决定可能基于用户举报、自动化信号、管理员审核或法律要求。",
        ],
      },
      {
        heading: "5. 服务变更",
        body: [
          "deepSea 可以随时增加、移除、暂停或调整功能，尤其是在产品仍处于原型迭代阶段时。",
          "我们可能更新本条款。如变更较为重要，我们会尽合理努力在产品内或通过其他合适方式提示。",
        ],
      },
      {
        heading: "6. 免责声明",
        body: [
          "服务按现状和可用状态提供。我们不保证服务持续可用、完全无错误，或所有内容都会被永久保存。",
          "你应自行判断是否使用本服务，并自行备份对你重要的内容。",
        ],
      },
      {
        heading: "7. 责任限制",
        body: ["在法律允许的最大范围内，deepSea 不对间接、偶然、特殊、后果性或惩罚性损害，以及数据、利润、商誉或机会损失承担责任。"],
      },
      {
        heading: "8. 联系方式",
        body: ["如对本条款有疑问，可以联系网站运营者或产品中显示的支持渠道。"],
      },
    ],
  },
  ja: {
    title: "利用規約",
    effectiveDate: "発効日：2026年7月6日",
    intro:
      "本利用規約は、deepSea を利用するための基本的なルールを説明するものです。deepSea は初期段階のソーシャルネットワークのプロトタイプであり、機能は改善に伴って変更される場合があります。",
    sections: [
      {
        heading: "1. 利用資格とアカウント",
        body: [
          "正確なアカウント情報を提供し、パスワードを安全に管理してください。",
          "あなたのアカウントで行われる活動については、あなたが責任を負います。アカウントが侵害されたと思われる場合は、利用を停止し、サポートへ連絡してください。",
        ],
      },
      {
        heading: "2. ユーザーコンテンツ",
        body: [
          "投稿、コメント、メディア、プロフィール情報、その他あなたが送信するコンテンツの所有権はあなたに残ります。",
          "コンテンツを投稿することで、deepSea がサービス運営に必要な範囲で、そのコンテンツをホスト、保存、表示、複製、配信するための世界的かつ非独占的なライセンスを付与するものとします。",
        ],
      },
      {
        heading: "3. 許容される利用",
        body: [
          "嫌がらせ、なりすまし、スパム、違法コンテンツ、未成年者への危害、同意のない私的情報の共有のために deepSea を利用してはいけません。",
          "サービスの妨害、セキュリティ回避、過度なスクレイピング、自分のものではないアカウントやデータへのアクセスを試みてはいけません。",
        ],
      },
      {
        heading: "4. モデレーションと措置",
        body: [
          "deepSea は、本規約またはサービスの安全性のために必要と判断した場合、報告の確認、コンテンツの非表示、アカウント機能の制限、アカウントの無効化、アクセスの削除を行うことがあります。",
          "モデレーション判断は、ユーザー報告、自動シグナル、管理者レビュー、法的要請に基づく場合があります。",
        ],
      },
      {
        heading: "5. サービスの変更",
        body: [
          "deepSea は、特にプロトタイプ開発中において、いつでも機能を追加、削除、一時停止、変更することがあります。",
          "本規約は更新される場合があります。重要な変更がある場合、製品内または適切な方法で通知するよう合理的に努めます。",
        ],
      },
      {
        heading: "6. 免責",
        body: [
          "本サービスは現状有姿かつ提供可能な範囲で提供されます。中断のない利用、エラーのない動作、すべてのコンテンツの永久保存を保証するものではありません。",
          "本サービスの利用はあなた自身の判断で行い、重要なコンテンツは自分でバックアップしてください。",
        ],
      },
      {
        heading: "7. 責任の制限",
        body: ["法律で認められる最大限の範囲で、deepSea は間接的、偶発的、特別、結果的、懲罰的損害、またはデータ、利益、信用、機会の損失について責任を負いません。"],
      },
      {
        heading: "8. 連絡先",
        body: ["本規約に関する質問は、サイト運営者または製品内に表示されるサポート窓口までご連絡ください。"],
      },
    ],
  },
};

const privacy: Record<Locale, LegalDocument> = {
  en: {
    title: "Privacy Policy",
    effectiveDate: "Effective date: July 6, 2026",
    intro:
      "This Privacy Policy explains how deepSea collects, uses, and protects information when you use the service.",
    sections: [
      {
        heading: "1. Information you provide",
        body: [
          "We collect account information such as email address, display name, username, birth date, selected avatar, language, profile description, posts, comments, and uploaded media.",
          "If you contact support or administrators, we may keep the information needed to respond to your request.",
        ],
      },
      {
        heading: "2. Information collected automatically",
        body: [
          "We may collect technical information such as IP address, approximate IP-based location, user agent, session identifiers, timestamps, post view records, and basic interaction logs.",
          "This information helps operate the service, protect accounts, investigate abuse, and understand product reliability.",
        ],
      },
      {
        heading: "3. How we use information",
        body: [
          "We use information to create accounts, authenticate users, display profiles and timelines, process uploads, provide notifications, support moderation, prevent abuse, and maintain security.",
          "We may also use aggregated or de-identified information to improve the service.",
        ],
      },
      {
        heading: "4. Public content",
        body: [
          "Posts, comments, profile names, handles, avatars, and profile descriptions may be visible to other users according to the product design.",
          "Avoid posting sensitive personal information that you do not want others to see.",
        ],
      },
      {
        heading: "5. Sharing and disclosure",
        body: [
          "We do not sell personal information.",
          "We may disclose information when required by law, to protect the service and users, to investigate abuse, or to vendors who help operate infrastructure under appropriate confidentiality obligations.",
        ],
      },
      {
        heading: "6. Retention",
        body: [
          "We keep information for as long as needed to provide the service, meet legal obligations, resolve disputes, maintain backups, and enforce our rules.",
          "Deleted or hidden content may remain in backups or moderation records for a limited period.",
        ],
      },
      {
        heading: "7. Your choices",
        body: [
          "You can update certain profile and account information in the product.",
          "You may request deletion or correction through the site operator or support channel, subject to safety, legal, and technical limits.",
        ],
      },
      {
        heading: "8. Security and children",
        body: [
          "We use reasonable technical and organizational measures to protect information, but no online service can be guaranteed perfectly secure.",
          "deepSea is not intended for children below the minimum age required by applicable law.",
        ],
      },
      {
        heading: "9. Changes and contact",
        body: [
          "We may update this Privacy Policy as the service changes. Questions can be sent to the site operator or support contact shown in the product.",
        ],
      },
    ],
  },
  zh: {
    title: "隐私政策",
    effectiveDate: "生效日期：2026年7月6日",
    intro: "本隐私政策说明你使用 deepSea 时，我们如何收集、使用和保护相关信息。",
    sections: [
      {
        heading: "1. 你提供的信息",
        body: [
          "我们会收集账号信息，例如邮箱、显示名称、用户名、出生日期、所选头像、语言、个人简介、帖子、评论和上传媒体。",
          "如果你联系支持或管理员，我们可能保留处理该请求所需的信息。",
        ],
      },
      {
        heading: "2. 自动收集的信息",
        body: [
          "我们可能收集技术信息，例如 IP 地址、基于 IP 的大致地区、User-Agent、session 标识、时间戳、帖子浏览记录和基础互动日志。",
          "这些信息用于运营服务、保护账号、调查滥用行为，并了解产品可靠性。",
        ],
      },
      {
        heading: "3. 信息用途",
        body: [
          "我们使用信息来创建账号、验证身份、展示个人资料和时间线、处理上传、提供通知、支持内容治理、防止滥用并维护安全。",
          "我们也可能使用汇总或去标识化信息改进服务。",
        ],
      },
      {
        heading: "4. 公开内容",
        body: [
          "帖子、评论、显示名称、用户名、头像和个人简介可能会按照产品设计展示给其他用户。",
          "请避免发布你不希望他人看到的敏感个人信息。",
        ],
      },
      {
        heading: "5. 共享与披露",
        body: [
          "我们不会出售个人信息。",
          "在法律要求、保护服务和用户、调查滥用，或由受保密义务约束的基础设施服务商协助运营时，我们可能披露必要信息。",
        ],
      },
      {
        heading: "6. 保留期限",
        body: [
          "我们会在提供服务、履行法律义务、解决争议、维护备份和执行规则所需的期间内保留信息。",
          "已删除或隐藏的内容可能会在备份或治理记录中有限期保留。",
        ],
      },
      {
        heading: "7. 你的选择",
        body: [
          "你可以在产品中更新部分个人资料和账号信息。",
          "你可以通过网站运营者或支持渠道请求删除或更正信息，但可能受到安全、法律和技术限制。",
        ],
      },
      {
        heading: "8. 安全与儿童",
        body: [
          "我们会采取合理的技术和组织措施保护信息，但任何在线服务都无法保证绝对安全。",
          "deepSea 不面向低于适用法律最低年龄要求的儿童。",
        ],
      },
      {
        heading: "9. 变更与联系",
        body: ["我们可能随着服务变化更新本隐私政策。如有疑问，可以联系网站运营者或产品中显示的支持渠道。"],
      },
    ],
  },
  ja: {
    title: "プライバシーポリシー",
    effectiveDate: "発効日：2026年7月6日",
    intro: "本プライバシーポリシーは、deepSea の利用時に情報をどのように収集、利用、保護するかを説明します。",
    sections: [
      {
        heading: "1. あなたが提供する情報",
        body: [
          "メールアドレス、表示名、ユーザー名、生年月日、選択したアバター、言語、プロフィール説明、投稿、コメント、アップロードしたメディアなどのアカウント情報を収集します。",
          "サポートまたは管理者に連絡した場合、対応に必要な情報を保持することがあります。",
        ],
      },
      {
        heading: "2. 自動的に収集される情報",
        body: [
          "IP アドレス、IP に基づくおおよその地域、User-Agent、セッション識別子、タイムスタンプ、投稿閲覧記録、基本的な操作ログなどの技術情報を収集する場合があります。",
          "これらの情報は、サービス運営、アカウント保護、不正利用の調査、製品の信頼性向上に利用されます。",
        ],
      },
      {
        heading: "3. 情報の利用目的",
        body: [
          "アカウント作成、認証、プロフィールとタイムラインの表示、アップロード処理、通知、モデレーション、不正利用防止、セキュリティ維持のために情報を利用します。",
          "集計または匿名化された情報をサービス改善に利用する場合があります。",
        ],
      },
      {
        heading: "4. 公開コンテンツ",
        body: [
          "投稿、コメント、表示名、ハンドル、アバター、プロフィール説明は、製品設計に従って他のユーザーに表示される場合があります。",
          "他人に見られたくない機微な個人情報を投稿しないでください。",
        ],
      },
      {
        heading: "5. 共有と開示",
        body: [
          "個人情報を販売することはありません。",
          "法令により必要な場合、サービスやユーザーを保護する場合、不正利用を調査する場合、または守秘義務を負うインフラ提供者が運営を支援する場合に、必要な情報を開示することがあります。",
        ],
      },
      {
        heading: "6. 保持期間",
        body: [
          "サービス提供、法的義務、紛争解決、バックアップ維持、ルール執行に必要な期間、情報を保持します。",
          "削除または非表示にされたコンテンツは、バックアップやモデレーション記録に一定期間残る場合があります。",
        ],
      },
      {
        heading: "7. あなたの選択",
        body: [
          "製品内で一部のプロフィール情報やアカウント情報を更新できます。",
          "安全上、法的、技術的な制限の範囲内で、サイト運営者またはサポート窓口に削除や訂正を依頼できます。",
        ],
      },
      {
        heading: "8. セキュリティと子ども",
        body: [
          "情報保護のため合理的な技術的および組織的措置を講じますが、オンラインサービスに完全な安全性を保証することはできません。",
          "deepSea は、適用法で定められる最低年齢未満の子どもを対象としていません。",
        ],
      },
      {
        heading: "9. 変更と連絡先",
        body: ["サービスの変更に伴い、本プライバシーポリシーを更新する場合があります。質問は、サイト運営者または製品内のサポート窓口までご連絡ください。"],
      },
    ],
  },
};

const labels = {
  en: { back: "Back", language: "Language" },
  zh: { back: "返回", language: "语言" },
  ja: { back: "戻る", language: "言語" },
};

export function LegalPage({ type }: { type: "terms" | "privacy" }) {
  const [locale, setLocale] = useState<Locale>("en");
  const document = type === "terms" ? terms[locale] : privacy[locale];
  const text = labels[locale];

  return (
    <main className="legal-shell">
      <section className="legal-panel">
        <header className="legal-header">
          <Link href="/register" aria-label={text.back}>
            <ArrowLeft size={22} />
          </Link>
          <div>
            <img src="/deepsea-logo.svg" alt="" />
            <span>deepSea</span>
          </div>
          <label className="legal-language">
            <Globe2 size={17} />
            <span>{text.language}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </label>
        </header>

        <article className="legal-document">
          <p className="legal-date">{document.effectiveDate}</p>
          <h1>{document.title}</h1>
          <p className="legal-intro">{document.intro}</p>
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </article>
      </section>
    </main>
  );
}
