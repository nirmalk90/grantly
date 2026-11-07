import { Modal } from './Modal';
import { Button } from './ui';
import { useNavigate } from 'react-router-dom';

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: '01',
    title: 'Discover a fit',
    body: 'Set your profile and review the opportunities that match your study level and eligibility.',
  },
  {
    n: '02',
    title: 'Get application-ready',
    body: 'Use your document vault to see what you already have and what to gather next.',
  },
  {
    n: '03',
    title: 'Track every step',
    body: 'Save promising schemes, move them through your pipeline, and keep an eye on deadlines.',
  },
  {
    n: '04',
    title: 'Apply on the official portal',
    body: 'Grantly helps you plan. Always verify current rules and submit through the official provider website.',
  },
];

export function GuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <Modal open={open} titleId="guide-title" onClose={onClose}>
      <p className="eyebrow">Your simple playbook</p>
      <h2 id="guide-title" className="dialog-title">
        From discovery to funding.
      </h2>
      <p className="dialog-sub">A calm, practical way to make the scholarship journey feel manageable.</p>
      <ol className="guide-steps">
        {STEPS.map((s) => (
          <li key={s.n}>
            <span className="guide-num">{s.n}</span>
            <div>
              <strong>{s.title}</strong>
              <p>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="dialog-actions">
        <Button
          variant="primary"
          onClick={() => {
            onClose();
            navigate('/discover');
          }}
        >
          Start discovering
        </Button>
      </div>
    </Modal>
  );
}
