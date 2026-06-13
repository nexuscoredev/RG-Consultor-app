import { Link, useParams } from 'react-router-dom';

import { BackLink } from '@/components/BackLink';
import { Card } from '@/components/Card';
import { CommercialFormBySlug, COMMERCIAL_FORM_SLUGS } from '@/components/commercial/CommercialForms';
import { PageHeader } from '@/components/PageHeader';
import { TOOL_CONTENT } from '@/lib/commercialContent';

export function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const content = slug ? TOOL_CONTENT[slug] : undefined;
  const hasForm = slug && COMMERCIAL_FORM_SLUGS.has(slug);

  if (!content) {
    return (
      <div className="page">
        <BackLink to="/comercial" />
        <PageHeader title="Ferramenta não encontrada" subtitle="O conteúdo solicitado não existe nesta versão." />
        <Link to="/comercial" className="chip">
          Ir ao funil comercial
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <BackLink to="/comercial" label="Voltar ao funil" />

      <PageHeader eyebrow="Kit comercial" title={content.title} subtitle={content.intro} />

      {hasForm && slug ? <CommercialFormBySlug slug={slug} /> : null}

      {!hasForm &&
        content.sections?.map((section) => (
          <Card key={section.title} elevated className="content-block">
            <h3 className="section-title">{section.title}</h3>
            {section.body ? <p className="content-block__body">{section.body}</p> : null}
            {section.bullets ? (
              <ul className="content-list">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        ))}

      {content.list ? (
        <Card elevated>
          <ul className="content-list content-list--check">
            {content.list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {content.faq?.map((item) => (
        <Card key={item.q} className="faq-card">
          <h4 className="faq-card__q">{item.q}</h4>
          <p className="faq-card__a">{item.a}</p>
        </Card>
      ))}
    </div>
  );
}
