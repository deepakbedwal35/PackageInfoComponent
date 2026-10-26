import React from 'react';
import { Card, Typography, Button } from '@mui/material';

export class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Silently capture
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            Something went wrong loading this component
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            An unexpected error occurred while rendering package metrics.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => this.setState({ hasError: false })}
            sx={{ minHeight: 36, borderRadius: '6px', textTransform: 'none', fontWeight: 600 }}
          >
            Reload component
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default ComponentErrorBoundary;
export { ComponentErrorBoundary as ErrorBoundary };
