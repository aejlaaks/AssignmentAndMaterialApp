import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Grid,
  Divider,
  CircularProgress,
  Paper,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { AIGradingSettings as AISettings } from '../../types';
import aiGradingService from '../../services/aiGradingService';

export const AIGradingSettings: React.FC = () => {
  const [settings, setSettings] = useState<AISettings>({
    enabled: false,
    provider: 'OpenAI',
    mode: 'Assisted',
    markAsAIGenerated: true,
    openAI: {
      apiKey: '',
      model: 'gpt-4o',
      maxTokens: 2000,
    },
    azureOpenAI: {
      endpoint: '',
      apiKey: '',
      deploymentName: '',
      apiVersion: '2024-02-15-preview',
    },
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const loadedSettings = await aiGradingService.getAIGradingSettings();
      setSettings(loadedSettings);
    } catch (err) {
      console.error('Error loading AI grading settings:', err);
      setError('Asetusten lataaminen epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiGradingService.updateAIGradingSettings(settings);
      setSuccess(true);
      setError(result.message);
    } catch (err) {
      console.error('Error saving AI grading settings:', err);
      setError(err instanceof Error ? err.message : 'Asetusten tallennus epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await aiGradingService.testConnection();
      setTestResult(result);
    } catch (err) {
      console.error('Error testing AI connection:', err);
      setTestResult({
        success: false,
        message: 'Yhteyden testaus epäonnistui',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <PsychologyIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" component="h1">
              AI-arvioinnin asetukset
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Konfiguroi AI-pohjainen automaattinen arviointi
            </Typography>
          </Box>
        </Box>

        {loading && !settings ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              Huomio: Asetusten muutokset vaativat sovelluksen uudelleenkäynnistyksen.
            </Alert>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Yleiset asetukset
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enabled}
                          onChange={(e) =>
                            setSettings({ ...settings, enabled: e.target.checked })
                          }
                        />
                      }
                      label="Ota AI-arviointi käyttöön"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>AI-palveluntarjoaja</InputLabel>
                      <Select
                        value={settings.provider}
                        label="AI-palveluntarjoaja"
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            provider: e.target.value as 'OpenAI' | 'AzureOpenAI',
                          })
                        }
                      >
                        <MenuItem value="OpenAI">OpenAI</MenuItem>
                        <MenuItem value="AzureOpenAI">Azure OpenAI</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Arviointitila</InputLabel>
                      <Select
                        value={settings.mode}
                        label="Arviointitila"
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            mode: e.target.value as 'Automatic' | 'Assisted',
                          })
                        }
                      >
                        <MenuItem value="Assisted">
                          Avustettu (opettaja hyväksyy)
                        </MenuItem>
                        <MenuItem value="Automatic">
                          Automaattinen (suora tallennus)
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.markAsAIGenerated}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              markAsAIGenerated: e.target.checked,
                            })
                          }
                        />
                      }
                      label="Merkitse AI-generoidut arvioinnit"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {settings.provider === 'OpenAI' && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    OpenAI-asetukset
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="API-avain"
                        type="password"
                        value={settings.openAI?.apiKey || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            openAI: {
                              ...settings.openAI!,
                              apiKey: e.target.value,
                            },
                          })
                        }
                        helperText="OpenAI API-avaimesi (tallennetaan turvallisesti)"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Malli"
                        value={settings.openAI?.model || 'gpt-4o'}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            openAI: {
                              ...settings.openAI!,
                              model: e.target.value,
                            },
                          })
                        }
                        helperText="Esim. gpt-4o, gpt-4-turbo"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Max Tokens"
                        type="number"
                        value={settings.openAI?.maxTokens || 2000}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            openAI: {
                              ...settings.openAI!,
                              maxTokens: parseInt(e.target.value),
                            },
                          })
                        }
                        helperText="Maksimi tokenimäärä vastauksessa"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {settings.provider === 'AzureOpenAI' && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Azure OpenAI -asetukset
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Endpoint"
                        value={settings.azureOpenAI?.endpoint || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            azureOpenAI: {
                              ...settings.azureOpenAI!,
                              endpoint: e.target.value,
                            },
                          })
                        }
                        helperText="Azure OpenAI resurssisi endpoint-osoite"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="API-avain"
                        type="password"
                        value={settings.azureOpenAI?.apiKey || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            azureOpenAI: {
                              ...settings.azureOpenAI!,
                              apiKey: e.target.value,
                            },
                          })
                        }
                        helperText="Azure OpenAI API-avaimesi"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Deployment Name"
                        value={settings.azureOpenAI?.deploymentName || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            azureOpenAI: {
                              ...settings.azureOpenAI!,
                              deploymentName: e.target.value,
                            },
                          })
                        }
                        helperText="Mallin deployment-nimi"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="API Version"
                        value={settings.azureOpenAI?.apiVersion || '2024-02-15-preview'}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            azureOpenAI: {
                              ...settings.azureOpenAI!,
                              apiVersion: e.target.value,
                            },
                          })
                        }
                        helperText="Azure API versio"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {testResult && (
              <Alert
                severity={testResult.success ? 'success' : 'error'}
                icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                sx={{ mb: 3 }}
              >
                {testResult.message}
              </Alert>
            )}

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleTest}
                disabled={loading || testing || !settings.enabled}
                startIcon={testing ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              >
                {testing ? 'Testataan...' : 'Testaa yhteyttä'}
              </Button>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Tallennetaan...' : 'Tallenna asetukset'}
              </Button>
            </Box>
          </>
        )}
      </Paper>

      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          Asetukset tallennettu onnistuneesti!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error && !success}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AIGradingSettings;

