# Authored by Will Morrow

# Deployment Guide

This project is deployed to **Vercel**. Instructions for auto deployment in your own repo can be found here: https://vercel.com/docs/git/vercel-for-github

## Production Environment

- Hosting platform: Vercel
- Deployment trigger: automatic deploys from `main`
- Production URL: <https://occ-database-9ikt0cwkc-john-shidemantles-projects.vercel.app>
- Data provider: Supabase

The Docker-based setup in the repository is for development use and is not part of the production deployment process.

## Required Environment Variables

The following environment variables must be configured in Vercel for the production deployment:

```env
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_DATA_PROVIDER=supabase
```
The supabase API keys are found in "Project Settings" under API Keys.

These variables are consumed by the React frontend at build time. If either Supabase variable is missing, the application will fail during startup.

## Deployment Process

1. Create and test changes locally.
2. Open a pull request targeting `main`.
3. Merge the pull request after review and verification.
4. Vercel automatically starts a new production deployment from the updated `main` branch.
5. Once the build finishes, verify the deployed application at the production URL.

## Vercel Configuration Notes

- The project should remain connected to the repository branch used for production: `main`.
- Environment variables should be stored in Vercel rather than committed to the repository.
- Because this is a Create React App frontend, the required `REACT_APP_*` variables must be present during the Vercel build.

## Post-Deployment Verification

After each production deployment, verify:

- The site loads successfully at the production URL.
- Login and authenticated routes still work.
- The frontend can connect to Supabase without configuration errors.
- Core CRUD flows behave as expected.

## Supabase Handover

Supabase is being handed over with the project and does not need to be provisioned again as part of deployment. The deployment process only requires that the correct Supabase environment variables are present in Vercel.
