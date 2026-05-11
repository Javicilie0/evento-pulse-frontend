import Link from 'next/link'

export default function CreateEventPage() {
  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-red">Ново събитие</span>
          <h1 data-i18n-html="event.create.title">Създай <span>събитие</span>.</h1>
          <p>Формулярът за създаване на събитие е достъпен в основното приложение.</p>
        </div>
      </div>
      <div className="groove-empty-card mt-4">
        <i className="bi bi-plus-circle" />
        <h2 className="groove-panel-title">Създай ново събитие</h2>
        <p className="groove-panel-intro">
          За да създадеш събитие, трябва да имаш акаунт на организатор.
        </p>
        <div className="groove-form-actions mt-3 justify-content-center">
          <Link href="/account/apply" className="groove-button groove-button-dark">
            <i className="bi bi-person-plus" /> Кандидатствай за организатор
          </Link>
          <Link href="/" className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Назад
          </Link>
        </div>
      </div>
    </section>
  )
}
