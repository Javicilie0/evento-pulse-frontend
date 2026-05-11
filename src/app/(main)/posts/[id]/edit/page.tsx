import Link from 'next/link'

export default async function PostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <section className="groove-app-page">
      <div className="groove-empty-card">
        <i className="bi bi-pencil" />
        <h1 className="groove-panel-title">Редакция на публикация</h1>
        <p className="groove-panel-intro">Редакцията през API още не е активирана. Можеш да отвориш публикацията или да създадеш нова.</p>
        <div className="groove-form-actions justify-content-center">
          <Link href={`/posts/${id}`} className="groove-button groove-button-paper">Назад</Link>
          <Link href="/flow/new" className="groove-button groove-button-dark">Нова публикация</Link>
        </div>
      </div>
    </section>
  )
}
