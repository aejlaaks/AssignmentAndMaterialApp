import { type FC, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  Grid,
} from '@mui/material';
import { useAuthState, useAuthActions } from '../hooks/useRedux';
import { FormField } from '../components/forms/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

export const Profile: FC = () => {
  const { user, isLoading, error } = useAuthState();
  const { updateProfile } = useAuthActions();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = useCallback((field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      await updateProfile(formData);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }, [formData, updateProfile]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <Box>
      <PageHeader
        title="Profiili"
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader title="Henkilötiedot" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormField
                  type="text"
                  required
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormField
                  type="text"
                  required
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                />
              </Grid>
              <Grid item xs={12}>
                <FormField
                  type="email"
                  fullWidth
                  label="Email Address"
                  value={formData.email}
                  onChange={handleChange('email')}
                />
              </Grid>
              <Grid item xs={12}>
                <FormField
                  type="tel"
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                />
              </Grid>
              <Grid item xs={12}>
                <FormField
                  type="text"
                  fullWidth
                  label="Bio"
                  multiline
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange('bio')}
                />
              </Grid>
            </Grid>

            {saveError && (
              <Box sx={{ mt: 3 }}>
                <ErrorAlert message={saveError} />
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>
    </Box>
  );
};
