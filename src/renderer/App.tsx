import AddWordForm from './features/add-word/AddWordForm';
import { ReviewSession } from './features/review';

function App() {
  return (
    <div className="app-shell">
      <div className="page-stack">
        <AddWordForm />
        <ReviewSession />
      </div>
    </div>
  );
}

export default App;
