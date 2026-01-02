import React from 'react';
import { Card } from '@/presentation/shared/components/Card/Card';
import styles from './AddFormCard.module.css';

type Props = {
  title?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  testId?: string;
};

export function AddFormCard({ title, children, actions, testId }: Props) {
  return (
    <Card data-testid={testId}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      <div className={styles.content}>{children}</div>
    </Card>
  );
}

export default AddFormCard;
