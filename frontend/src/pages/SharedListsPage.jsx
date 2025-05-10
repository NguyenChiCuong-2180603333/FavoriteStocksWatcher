import React from 'react';
import { Typography, Box, Paper, Tabs, Tab } from '@mui/material';
import ListsSharedWithMe from '../components/ListsSharedWithMe';
import MySharedInstances from '../components/MySharedInstances';
import { useTheme } from '@mui/material/styles';

const SharedListsPage = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (

    <Paper elevation={0} sx={{ 
        p: { xs: theme.spacing(2), sm: theme.spacing(3) },
      }}>
      <Typography variant="h4" component="h1" sx={{ mb: theme.spacing(3) }}> 
        Quản lý Chia sẻ
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: theme.spacing(3) }}>
        <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="shared lists tabs" 
            indicatorColor="primary" 
            textColor="primary"
        >
          <Tab label="Được chia sẻ với tôi" id="shared-with-me-tab" aria-controls="shared-with-me-panel" />
          <Tab label="Tôi đã chia sẻ" id="my-shares-tab" aria-controls="my-shares-panel" />
        </Tabs>
      </Box>

     
      <Box
        role="tabpanel"
        hidden={tabValue !== 0}
        id="shared-with-me-panel"
        aria-labelledby="shared-with-me-tab"
      >
        {tabValue === 0 && (
          <ListsSharedWithMe />
        )}
      </Box>

    
      <Box
        role="tabpanel"
        hidden={tabValue !== 1}
        id="my-shares-panel"
        aria-labelledby="my-shares-tab"
      >
        {tabValue === 1 && (
          <MySharedInstances />
        )}
      </Box>
    </Paper>
  );
};

export default SharedListsPage;
