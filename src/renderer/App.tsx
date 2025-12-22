import AddWordForm from './features/add-word/AddWordForm';
import { ReviewSession } from './features/review';
import { ActivityHeatMap } from './features/heatmap/ActivityHeatMap';

function App() {
  return (
    <div className="app-shell">
      <div className="page-stack">
        <AddWordForm />
        <ReviewSession />
        <ActivityHeatMap />
      </div>
    </div>
  );
}

export default App;
