import Link from 'next/link'

export default async function PostDeletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <section className="groove-app-page">
      <div className="groove-empty-card">
        <i className="bi bi-trash" />
        <h1 className="groove-panel-title">Изтриване на публикация</h1>
        <p className="groove-panel-intro">Изтриването се управлява през админ панела за момента.</p>
        <Link href={`/posts/${id}`} className="groove-button groove-button-paper mt-3">Назад</Link>
      </div>
    </section>
  )
}
