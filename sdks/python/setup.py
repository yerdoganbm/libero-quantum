from setuptools import setup, find_packages

setup(
    name="neuro-core",
    version="2.0.0",
    description="Libero Neuro-Core Python SDK - Universal analytics & self-evolution for any app",
    author="Libero",
    packages=find_packages(),
    install_requires=["requests>=2.28.0"],
    python_requires=">=3.8",
)
