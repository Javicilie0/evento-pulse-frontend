export default function PrivacyPage() {
  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-red">Информация</span>
          <h1>Политика за <span>поверителност</span>.</h1>
          <p>
            Тази страница описва как Evento обработва основните данни в платформата и каква информация
            се използва за профили, събития, публикации и билети.
          </p>
        </div>
      </div>

      <div className="groove-page-grid groove-page-grid-2">
        <article className="groove-paper-card">
          <span className="groove-kicker">Какво съхраняваме</span>
          <h2 className="groove-panel-title">Профилни и <span>платформени данни</span>.</h2>
          <p className="groove-panel-intro">
            За да работи приложението, могат да се съхраняват име, имейл, потребителско име,
            предпочитания, организаторски данни и история на билети.
          </p>
        </article>

        <article className="groove-info-card">
          <span className="groove-kicker">Използване</span>
          <h2 className="groove-panel-title">Данните се използват за <span>основните функции</span>.</h2>
          <p className="groove-panel-intro">
            Това включва вход в системата, публикуване на събития и постове, препоръки, покупки на билети
            и валидация при достъп до събитие.
          </p>
        </article>
      </div>
    </section>
  )
}
