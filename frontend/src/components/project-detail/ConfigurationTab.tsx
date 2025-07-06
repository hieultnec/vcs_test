import React from 'react';

const ConfigurationTab: React.FC<{ projectId: string }> = ({ projectId }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Workflow Configuration</h2>
      <p>This tab will allow you to edit workflow configuration variables (API keys, endpoints, etc.) for project <b>{projectId}</b>.</p>
      {/* TODO: Implement configuration form */}
    </div>
  );
};

export default ConfigurationTab; 