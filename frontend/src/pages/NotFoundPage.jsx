import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="container page-gap">
      <section className="panel">
        <h1>Page Not Found</h1>
        <p>The page you requested does not exist.</p>
        <Link to="/" className="button-link">Go Home</Link>
      </section>
    </div>
  );
}

export default NotFoundPage;
