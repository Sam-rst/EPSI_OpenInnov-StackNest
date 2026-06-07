import { z } from 'zod'

/** Longueur minimale d'un mot de passe (politique alignée sur le backend). */
const PASSWORD_MIN_LENGTH = 8

/** Email requis et bien formé (messages d'erreur en français). */
const emailField = z.email({ message: 'Adresse e-mail invalide' })

/**
 * Politique de mot de passe (création / réinitialisation) : au moins 8
 * caractères et au moins un chiffre. Alignée sur le Value Object backend.
 */
const strongPasswordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { message: 'Au moins 8 caractères' })
  .regex(/\d/, { message: 'Au moins un chiffre' })

/** Connexion : le backend valide les identifiants, le front exige juste un email + un mot de passe. */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { message: 'Mot de passe requis' }),
})

/** Inscription : email + mot de passe conforme à la politique. */
export const registerSchema = z.object({
  email: emailField,
  password: strongPasswordField,
})

/** Demande de réinitialisation : email seul (réponse générique anti-énumération). */
export const forgotSchema = z.object({
  email: emailField,
})

/** Réinitialisation : nouveau mot de passe conforme à la politique (le token vient de l'URL). */
export const resetSchema = z.object({
  password: strongPasswordField,
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ForgotFormValues = z.infer<typeof forgotSchema>
export type ResetFormValues = z.infer<typeof resetSchema>
