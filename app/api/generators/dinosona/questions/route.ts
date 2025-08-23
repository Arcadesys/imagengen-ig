import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminRequest } from "@/lib/admin";
import { createSkinColorQuestion } from "@/lib/shared-skin-color";

const defaultSchema = {
  title: "Dinosona Photobooth",
  intro: "Take or upload a photo, then answer a few questions to become your dinosaur persona.",
  questions: [
    {
      id: "dinosaur",
      text: "What kind of dinosaur are you?",
      type: "multi-select",
      placeholder: "Search dinosaurs…",
      options: [
        "Tyrannosaurus rex",
        "Velociraptor",
        "Triceratops",
        "Stegosaurus",
        "Brachiosaurus",
        "Ankylosaurus",
        "Spinosaurus",
        "Allosaurus",
        "Dilophosaurus",
        "Parasaurolophus",
        "Iguanodon",
        "Pachycephalosaurus",
        "Carnotaurus",
        "Compsognathus",
        "Gallimimus",
        "Microraptor",
        "Archaeopteryx",
        "Oviraptor",
      ],
    },
    {
      id: "gender",
      text: "What gender is your dinosaur?",
      type: "gender",
      options: ["male", "female", "nonbinary"],
      allowCustom: true,
      placeholder: "Enter a custom gender",
    },
    // Use standardized skin color question
    createSkinColorQuestion("What color should your dinosaur's skin/scales be?"),
  ],
  promptTemplate:
    "Transform the person in the photo into a friendly dinosona character. Species: {{dinosaur}}. Gender: {{gender}}. {{#if skinColor}}Skin/scale coloring: {{skinColor}}.{{/if}} Preserve facial likeness and identity while translating features into dinosaur anatomy. Cute, family-friendly, highly detailed, studio-quality illustration.",
};

export async function GET(_req: NextRequest) {
  try {
    const slug = "dinosona";
    let generator = await (prisma as any).imageGenerator.findUnique({ where: { slug } });

    if (!generator) {
      generator = await (prisma as any).imageGenerator.create({
        data: {
          slug,
          name: "Dinosona",
          description: "Turn your photo into your dinosaur persona while keeping your background.",
          style: "dinosona",
          config: { schema: defaultSchema, questions: defaultSchema.questions, promptTemplate: defaultSchema.promptTemplate },
          isActive: true,
        },
      });
    } else {
      const cfg = (generator as any).config || {};
      if (!cfg.schema || !cfg.questions || !cfg.promptTemplate) {
        generator = await (prisma as any).imageGenerator.update({
          where: { slug },
          data: {
            config: { ...cfg, schema: defaultSchema, questions: defaultSchema.questions, promptTemplate: defaultSchema.promptTemplate },
          },
        });
      }
    }

    const cfg = (generator as any).config || {};
    const schema = cfg.schema || defaultSchema;

    return NextResponse.json({ schema, generator: { slug: generator.slug, name: generator.name } });
  } catch (error) {
    console.error("[dinosona/questions GET]", error);
    return NextResponse.json({ error: "Failed to load dinosona questions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isAdminRequest(request);
    if (!session?.user?.id && !isAdmin) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { schema } = await request.json();
    if (!schema || !schema.questions || !schema.promptTemplate) {
      return NextResponse.json({ error: "schema with questions and promptTemplate is required" }, { status: 400 });
    }

    const slug = "dinosona";
    let generator = await (prisma as any).imageGenerator.findUnique({ where: { slug } });
    if (!generator) {
      generator = await (prisma as any).imageGenerator.create({
        data: {
          slug,
          name: "Dinosona",
          description: "Turn your photo into your dinosaur persona while keeping your background.",
          style: "dinosona",
          isActive: true,
          config: { schema, questions: schema.questions, promptTemplate: schema.promptTemplate, references: schema.references ?? null },
        },
      });
    } else {
      generator = await (prisma as any).imageGenerator.update({
        where: { slug },
        data: {
          config: { ...(generator as any).config, schema, questions: schema.questions, promptTemplate: schema.promptTemplate, references: schema.references ?? null },
        },
      });
    }

    return NextResponse.json({ ok: true, generator });
  } catch (error) {
    console.error("[dinosona/questions POST]", error);
    return NextResponse.json({ error: "Failed to save dinosona questions" }, { status: 500 });
  }
}
